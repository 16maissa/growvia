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

export async function runOrchestrator(userId: string) {
  const prefs = await prisma.automationPrefs.findUnique({ where: { userId } });
  if (!prefs) return { message: "No automation prefs found" };

  if (prefs.mode === "libre" || prefs.mode === "guide") {
    return { message: "Orchestrator idle for this mode" };
  }

  // Get pending tasks scheduled for now or past
  const pendingTasks = await prisma.agentTask.findMany({
    where: {
      userId,
      status: "pending",
      scheduled_at: { lte: new Date() }
    },
    include: {
      actionPlan: true
    }
  });

  if (pendingTasks.length === 0) {
    return { message: "No pending tasks" };
  }

  const results = [];

  for (const task of pendingTasks) {
    // Check if task type is enabled in prefs
    const type = task.task_type.toLowerCase();
    
    // Quick validation map
    if (type === "reel" && !prefs.generate_reels) {
      await skipTask(task.id, "Reels generation disabled");
      continue;
    }
    if ((type === "image" || type === "carousel") && !prefs.generate_images) {
      await skipTask(task.id, "Image generation disabled");
      continue;
    }
    if (type === "quiz" && !prefs.generate_quizzes) {
      await skipTask(task.id, "Quiz generation disabled");
      continue;
    }
    if (type === "publish" && !prefs.auto_publish) {
      await skipTask(task.id, "Auto publish disabled");
      continue;
    }

    // Set to running
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: "running", executed_at: new Date() }
    });

    const webhookUrl = WEBHOOK_MAP[type] || WEBHOOK_MAP["reel"]; // fallback to video
    if (!webhookUrl) {
      await failTask(task.id, "Webhook URL missing for type: " + type);
      continue;
    }

    try {
      // Call N8N Agent
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          taskId: task.id,
          topic: task.actionPlan?.topic,
          cta: task.actionPlan?.cta,
          params: task.params_json,
          mode: prefs.mode // n8n can also use this to know if it should actually publish or just draft
        })
      });

      if (!res.ok) throw new Error("Agent Webhook Failed");

      const agentResult = await res.json();

      // N8N returned the generated content
      if (type !== "publish" && type !== "engagement") {
        const status = prefs.mode === "auto" ? "published" : "draft";

        await prisma.generatedContent.create({
          data: {
            userId,
            agentTaskId: task.id,
            type,
            content_json: agentResult.content || agentResult,
            preview_url: agentResult.preview_url,
            status,
            published_at: prefs.mode === "auto" ? new Date() : null,
          }
        });

        // Mark task as done
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: "done", result_json: agentResult }
        });

      } else {
        // Just a publish or engagement task
        await prisma.agentTask.update({
          where: { id: task.id },
          data: { status: "done", result_json: agentResult }
        });
      }

      results.push({ taskId: task.id, status: "success" });
    } catch (e: any) {
      await failTask(task.id, e.message);
      results.push({ taskId: task.id, status: "failed", error: e.message });
    }
  }

  return { message: "Orchestrator completed", results };
}

async function skipTask(id: string, reason: string) {
  await prisma.agentTask.update({
    where: { id },
    data: { status: "skipped", result_json: { reason } }
  });
}

async function failTask(id: string, error: string) {
  await prisma.agentTask.update({
    where: { id },
    data: { status: "failed", result_json: { error } }
  });
}
