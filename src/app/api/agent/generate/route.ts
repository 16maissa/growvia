import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Webhook mapping according to user instruction
const WEBHOOK_MAP: Record<string, string | undefined> = {
  "REEL": process.env.N8N_VIDEO_WEBHOOK_URL,
  "VIDEO": process.env.N8N_VIDEO_WEBHOOK_URL,
  "STORY": process.env.N8N_VIDEO_WEBHOOK_URL,
  "REEL|DM": process.env.N8N_VIDEO_WEBHOOK_URL,
  "POST": process.env.N8N_IMAGE_WEBHOOK_URL,
  "CAROUSEL": process.env.N8N_IMAGE_WEBHOOK_URL,
  "CARROUSEL": process.env.N8N_IMAGE_WEBHOOK_URL,
  "IMAGE": process.env.N8N_IMAGE_WEBHOOK_URL,
  "QUIZ": process.env.N8N_QUIZ_WEBHOOK_URL,
  "QA": process.env.N8N_QUIZ_WEBHOOK_URL,
  "Q&A": process.env.N8N_QUIZ_WEBHOOK_URL,
  "CURRICULUM": process.env.N8N_CURRICULUM_WEBHOOK_URL,
  "COURS": process.env.N8N_CURRICULUM_WEBHOOK_URL,
  "FORMATION": process.env.N8N_CURRICULUM_WEBHOOK_URL,
};

// Generates fallback AI content if the webhook fails using Anthropic Claude API or smart templates
async function generateAIFallback(type: string, topic: string, cta: string, niche: string, mainOffer: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      console.log("Calling direct Anthropic Claude API as fallback...");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1500,
          temperature: 0.7,
          messages: [
            {
              role: "user",
              content: `Génère un contenu de haute qualité pour Instagram.
Type de contenu: ${type}
Niche: ${niche}
Offre principale: ${mainOffer}
Sujet: ${topic}
Appel à l'action (CTA): ${cta}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const textContent = data.content?.[0]?.text || "";
        const cleanJSON = textContent.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJSON);
      }
    } catch (apiErr) {
      console.error("Error during direct Anthropic API call:", apiErr);
    }
  }

  const typeUpper = type.toUpperCase();

  if (typeUpper.includes("REEL") || typeUpper.includes("VIDEO") || typeUpper.includes("STORY")) {
    return {
      title: `Script — ${topic}`,
      hook: `Hook généré pour ${niche}`,
      body: `Contenu pour ${mainOffer}`,
      cta: cta || "CTA par défaut"
    };
  }

  return {
    title: topic,
    summary: `Contenu généré pour ${mainOffer}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ FIX UNIQUE ICI (NE CHANGE RIEN D'AUTRE)
    const userId = String(session.userId);

    const { actionPlanId } = await req.json();

    if (!actionPlanId) {
      return NextResponse.json({ error: "Le paramètre actionPlanId est requis." }, { status: 400 });
    }

    const actionPlan = await prisma.actionPlan.findUnique({
      where: { id: actionPlanId },
    });

    if (!actionPlan) {
      return NextResponse.json({ error: "ActionPlan non trouvé." }, { status: 404 });
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    const niche = userProfile?.niche || "Business";
    const mainOffer = userProfile?.main_offer || "Prestation Premium";
    const targetAudience = userProfile?.target_audience || "Entrepreneurs";

    const contentTypeUpper = (actionPlan.content_type || "REEL").toUpperCase();

    if (contentTypeUpper.includes("PROFILE") || contentTypeUpper.includes("BIO")) {
      await prisma.actionPlan.update({
        where: { id: actionPlanId },
        data: { status: "done" }
      });

      return NextResponse.json({
        success: true,
        type: "manual",
        content: {
          title: "Action manuelle requise",
          instructions: actionPlan.topic,
          cta: actionPlan.cta || "Mettre à jour le profil"
        }
      });
    }

    const webhookUrl = WEBHOOK_MAP[contentTypeUpper] || process.env.N8N_VIDEO_WEBHOOK_URL;

    const agentTask = await prisma.agentTask.create({
      data: {
        userId,
        actionPlanId: actionPlan.id,
        task_type: actionPlan.content_type.toLowerCase(),
        status: "running",
        scheduled_at: new Date(),
        params_json: {
          content_type: actionPlan.content_type,
          topic: actionPlan.topic,
          cta: actionPlan.cta,
          niche,
          main_offer: mainOffer,
          target_audience: targetAudience
        }
      }
    });

    let generatedResult: any = null;
    let fallbackUsed = false;

    if (webhookUrl) {
      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: agentTask.id,
            user_id: userId, // ✅ FIX
            content_type: actionPlan.content_type,
            topic: actionPlan.topic,
            cta: actionPlan.cta || "",
            niche,
            main_offer: mainOffer,
            target_audience: targetAudience
          })
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);

        const data = await res.json();
        generatedResult = Array.isArray(data) ? data[0] : data;
      } catch (e) {
        fallbackUsed = true;
      }
    } else {
      fallbackUsed = true;
    }

    if (fallbackUsed || !generatedResult) {
      generatedResult = await generateAIFallback(
        actionPlan.content_type,
        actionPlan.topic,
        actionPlan.cta || "",
        niche,
        mainOffer
      );
    }

    const content = await prisma.generatedContent.create({
      data: {
        userId,
        agentTaskId: agentTask.id,
        type: actionPlan.content_type.toLowerCase(),
        content_json: generatedResult,
        status: "draft"
      }
    });

    await prisma.agentTask.update({
      where: { id: agentTask.id },
      data: {
        status: "done",
        executed_at: new Date(),
        result_json: generatedResult
      }
    });

    await prisma.actionPlan.update({
      where: { id: actionPlanId },
      data: { status: "done" }
    });

    return NextResponse.json({
      success: true,
      type: actionPlan.content_type.toLowerCase(),
      content: generatedResult
    });

  } catch (error: any) {
    console.error("Generate Endpoint Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}