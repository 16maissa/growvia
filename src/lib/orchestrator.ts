import { prisma } from "@/lib/prisma";

const WEBHOOK_MAP: Record<string, string | undefined> = {
  "reel":       process.env.N8N_VIDEO_WEBHOOK_URL,
  "video":      process.env.N8N_VIDEO_WEBHOOK_URL,
  "story":      process.env.N8N_VIDEO_WEBHOOK_URL,
  "image":      process.env.N8N_IMAGE_WEBHOOK_URL,
  "carousel":   process.env.N8N_IMAGE_WEBHOOK_URL,
  "carrousel":  process.env.N8N_IMAGE_WEBHOOK_URL,
  "post":       process.env.N8N_IMAGE_WEBHOOK_URL,
  "quiz":       process.env.N8N_QUIZ_WEBHOOK_URL,
  "qa":         process.env.N8N_QUIZ_WEBHOOK_URL,
  "curriculum": process.env.N8N_CURRICULUM_WEBHOOK_URL,
  "cours":      process.env.N8N_CURRICULUM_WEBHOOK_URL,
  "formation":  process.env.N8N_CURRICULUM_WEBHOOK_URL,
};

export async function generatePlan(userId: string, formData: any) {
  const webhookUrl = process.env.N8N_ANALYSIS_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("N8N_ANALYSIS_WEBHOOK_URL is missing");

 
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      niche: formData.niche,
      audience: formData.audience,
      goals: formData.goals,
      preferences: formData.preferences,
    }),
  });

  if (!res.ok) throw new Error("Failed to generate plan via n8n");

  const data = await res.json();
  const tasks = data.tasks || data.content?.tasks || [];

  // 2. Save each returned task to AgentTask with status = "planned"
  const createdTasks = [];
  for (const t of tasks) {
    const task = await prisma.agentTask.create({
      data: {
        userId,
        task_type: t.type || t.content_type || "post",
        status: "planned",
        params_json: t,
        // Since we don't necessarily have an ActionPlan linked yet from just analysis, 
        // we store the topic in params_json or rely on the caller to link it.
      }
    });
    createdTasks.push(task);
  }

  // 3. Return tasks array for dashboard display
  return { tasks: createdTasks, raw: data };
}

export async function generateSingleTask(userId: string, taskId: string) {
  // 1. Read task from AgentTask by taskId
  const task = await prisma.agentTask.findUnique({
    where: { id: taskId },
    include: { actionPlan: true },
  });

  if (!task || task.userId !== userId) {
    return { success: false, error: "Task not found" };
  }

  // Fallback for topic: ActionPlan or params_json
  const taskParams: any = task.params_json || {};
  const topic = task.actionPlan?.topic || taskParams.topic || taskParams.action || "";
  const cta = task.actionPlan?.cta || taskParams.cta || "";

  // 2. Check AgentMemory for key "generated_topics"
  const topicsMemory = await getMemory(userId, "generated_topics");
  const generatedTopics: string[] = (topicsMemory as string[]) || [];

  if (topic && generatedTopics.includes(topic)) {
    return { skipped: true, reason: "Already generated" };
  }

  // 3. Update AgentTask status to "running"
  await prisma.agentTask.update({
    where: { id: taskId },
    data: { status: "running", executed_at: new Date() },
  });

  // 4. Resolve webhook URL from WEBHOOK_MAP using task.task_type
  const type = task.task_type.toLowerCase();
  const webhookUrl = WEBHOOK_MAP[type] || WEBHOOK_MAP["reel"];

  if (!webhookUrl) {
    await failTask(taskId, "Webhook URL missing for type: " + type);
    return { success: false, error: "Webhook URL missing" };
  }

  try {
    // 5. POST to webhook
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        taskId,
        topic,
        cta,
        params: task.params_json,
        mode: "semi-auto",
      }),
    });

    if (!res.ok) throw new Error("Webhook failed");

    const agentResult = await res.json();
    const content = agentResult.content || agentResult;
    const previewUrl = agentResult.preview_url || null;

    // 6. On success:
    await prisma.generatedContent.create({
      data: {
        userId,
        agentTaskId: taskId,
        type,
        content_json: content,
        preview_url: previewUrl,
        status: "draft",
        published_at: null,
      },
    });

    if (topic) {
      generatedTopics.push(topic);
      await setMemory(userId, "generated_topics", generatedTopics);
    }

    await prisma.agentTask.update({
      where: { id: taskId },
      data: { status: "done", result_json: agentResult },
    });

    return { success: true, preview_url: previewUrl, content };
  } catch (error: any) {
    // 7. On failure:
    await failTask(taskId, error.message);
    return { success: false, error: error.message };
  }
}

export async function runOrchestrator(userId: string) {
  // 1. Read AutomationPrefs for userId
  const prefs = await prisma.automationPrefs.findUnique({ where: { userId } });
  if (!prefs) return { message: "No automation prefs found" };

  // 2. If mode === "libre" or mode === "semi_auto" -> return idle
  if (prefs.mode === "libre" || prefs.mode === "semi_auto") {
    return { message: "Orchestrator idle for this mode" };
  }

  // 3. Fetch all AgentTask where status = "pending" and scheduled_at <= now
  const pendingTasks = await prisma.agentTask.findMany({
    where: {
      userId,
      status: "pending",
      scheduled_at: { lte: new Date() },
    },
    include: { actionPlan: true },
  });

  if (pendingTasks.length === 0) {
    return { message: "No pending tasks" };
  }

  const results = [];

  // 4. For each task:
  for (const task of pendingTasks) {
    const type = task.task_type.toLowerCase();

    // a. Check prefs
    if (type === "reel" && !prefs.generate_reels) {
      await skipTask(task.id, "Reels disabled");
      continue;
    }
    if ((type === "image" || type === "carousel" || type === "post") && !prefs.generate_images) {
      await skipTask(task.id, "Images disabled");
      continue;
    }
    if ((type === "quiz" || type === "qa") && !prefs.generate_quizzes) {
      await skipTask(task.id, "Quizzes disabled");
      continue;
    }

    // b. Check AgentMemory for duplicate topic
    const topicsMemory = await getMemory(userId, "generated_topics");
    const generatedTopics: string[] = (topicsMemory as string[]) || [];
    
    const taskParams: any = task.params_json || {};
    const topic = task.actionPlan?.topic || taskParams.topic || taskParams.action || "";

    if (topic && generatedTopics.includes(topic)) {
      await skipTask(task.id, "Topic already generated");
      continue;
    }

    // c. Update status to "running"
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: "running", executed_at: new Date() },
    });

    // d. POST to correct webhook
    const webhookUrl = WEBHOOK_MAP[type] || WEBHOOK_MAP["reel"];
    if (!webhookUrl) {
      await failTask(task.id, "Webhook missing");
      results.push({ taskId: task.id, status: "failed", error: "Webhook missing" });
      continue;
    }

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          taskId: task.id,
          topic,
          cta: task.actionPlan?.cta || taskParams.cta,
          params: task.params_json,
          mode: "auto",
        }),
      });

      if (!res.ok) throw new Error("Webhook failed");

      const agentResult = await res.json();
      const content = agentResult.content || agentResult;
      
      // e. On success
      // If it's just a publish task, we might not create a content record, but let's assume we do if it returns content.
      if (type !== "publish") {
        await prisma.generatedContent.create({
          data: {
            userId,
            agentTaskId: task.id,
            type,
            content_json: content,
            preview_url: agentResult.preview_url || null,
            status: "published",
            published_at: new Date(),
          },
        });
      }

      if (topic) {
        generatedTopics.push(topic);
        await setMemory(userId, "generated_topics", generatedTopics);
      }

      await prisma.agentTask.update({
        where: { id: task.id },
        data: { status: "done", result_json: agentResult },
      });

      results.push({ taskId: task.id, status: "success" });
    } catch (e: any) {
      // f. On failure
      await failTask(task.id, e.message);
      results.push({ taskId: task.id, status: "failed", error: e.message });
    }
  }

  // 5. Return { message, results }
  return { message: "Orchestrator completed", results };
}

export async function getMemory(userId: string, key: string) {
  const memory = await prisma.agentMemory.findUnique({
    where: { userId_key: { userId, key } },
  });
  return memory ? memory.value_json : null;
}

export async function setMemory(userId: string, key: string, value: any) {
  return prisma.agentMemory.upsert({
    where: { userId_key: { userId, key } },
    update: { value_json: value },
    create: { userId, key, value_json: value },
  });
}

async function skipTask(id: string, reason: string) {
  await prisma.agentTask.update({
    where: { id },
    data: { status: "skipped", result_json: { reason } },
  });
}

async function failTask(id: string, error: string) {
  await prisma.agentTask.update({
    where: { id },
    data: { status: "failed", result_json: { error } },
  });
}
