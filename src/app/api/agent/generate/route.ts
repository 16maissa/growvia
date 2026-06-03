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
Appel à l'action (CTA): ${cta}

Renvoie UNIQUEMENT un objet JSON valide, sans aucune phrase d'introduction ni de conclusion, sans bloc de code markdown.

Le format de sortie dépend du type :

Pour REEL, VIDEO, STORY :
{
  "hook": "Un hook accrocheur en moins de 5 secondes",
  "body": "Le corps du script divisé par étapes ou conseils simples",
  "cta": "L'appel à l'action précis",
  "title": "Titre du script"
}

Pour POST, CAROUSEL, CARROUSEL, IMAGE :
{
  "cover": "Titre d'accroche pour la slide de couverture",
  "slides": [
    "Texte et visuel suggéré pour la Slide 1",
    "Texte et visuel suggéré pour la Slide 2",
    "Texte et visuel suggéré pour la Slide 3",
    "Texte et visuel suggéré pour la Slide de fin (CTA)"
  ],
  "caption": "La légende d'accompagnement optimisée"
}

Pour QUIZ, QA, Q&A :
{
  "questions": [
    {
      "question": "Question du quiz ?",
      "options": ["Choix A", "Choix B", "Choix C", "Choix D"],
      "answer": "La bonne réponse"
    }
  ]
}

Pour CURRICULUM, COURS, FORMATION :
{
  "title": "Titre de la synthèse de cours",
  "summary": "Résumé structuré des points clés",
  "takeaways": ["Point clé 1", "Point clé 2", "Point clé 3"],
  "action_points": ["Action concrète 1", "Action concrète 2"]
}`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const textContent = data.content?.[0]?.text || "";
        const cleanJSON = textContent.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJSON);
      } else {
        const errText = await response.text();
        console.warn("Anthropic API call failed:", errText);
      }
    } catch (apiErr) {
      console.error("Error during direct Anthropic API call:", apiErr);
    }
  }

  // Pure premium local generation fallback if no API key or if API call fails
  console.log("Using premium local template fallback generation...");
  const typeUpper = type.toUpperCase();

  if (typeUpper.includes("REEL") || typeUpper.includes("VIDEO") || typeUpper.includes("STORY")) {
    return {
      title: `Script de Vidéo / Reel — ${topic.slice(0, 30)}...`,
      hook: `🚨 Arrêtez tout si vous êtes dans la niche: ${niche} ! Voici le secret de notre offre : ${mainOffer}.`,
      body: `Voici les 3 étapes clés pour réussir :\n1. Identifier précisément le problème de votre audience cible.\n2. Appliquer notre approche pour la valorisation de ${mainOffer}.\n3. Mesurer les résultats dès la première semaine.`,
      cta: cta || `Commente "STRATEGIE" sous ce Reel pour recevoir votre plan personnalisé !`
    };
  }

  if (typeUpper.includes("POST") || typeUpper.includes("CAROUSEL") || typeUpper.includes("IMAGE")) {
    return {
      cover: `🚀 Le secret pour propulser votre offre: ${mainOffer}`,
      slides: [
        "Slide 1: Pourquoi la plupart des créateurs échouent dans la niche: " + niche,
        "Slide 2: L'approche innovante que nous utilisons pour " + mainOffer,
        "Slide 3: Exemple concret d'implémentation et de résultats",
        "Slide 4: Votre plan d'action immédiat pour démarrer dès ce soir"
      ],
      caption: `Vous voulez passer au niveau supérieur ? ${cta || "Lien en bio pour commencer !"}`
    };
  }

  if (typeUpper.includes("QUIZ") || typeUpper.includes("QA")) {
    return {
      questions: [
        {
          question: `Quel est le plus grand obstacle pour réussir dans la niche: ${niche} ?`,
          options: ["Manque de consistance", "Offre non optimisée", "Reach instagram faible", "Toutes ces réponses"],
          answer: "Toutes ces réponses"
        },
        {
          question: `Quelle offre est la plus rentable d'après notre guide ?`,
          options: [`Notre offre : ${mainOffer}`, "Produits low-ticket", "Affiliation générique", "Aucune idée"],
          answer: `Notre offre : ${mainOffer}`
        }
      ]
    };
  }

  // Curriculum/default fallback
  return {
    title: `Synthèse de cours — ${topic}`,
    summary: `Ce module couvre les fondations nécessaires pour positionner et vendre ${mainOffer} auprès de votre audience dans la niche ${niche}.`,
    takeaways: [
      `Clarifier la proposition de valeur de ${mainOffer}`,
      "Cibler les bons points de douleur de l'audience",
      "Établir une structure de prix premium"
    ],
    action_points: [
      `Rédiger le pitch de vente de ${mainOffer}`,
      `Lancer une séquence de stories avec le CTA : ${cta}`
    ]
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { actionPlanId, userId } = await req.json();

    if (!actionPlanId) {
      return NextResponse.json({ error: "Le paramètre actionPlanId est requis." }, { status: 400 });
    }

    // 1. Lire l'ActionPlan
    const actionPlan = await prisma.actionPlan.findUnique({
      where: { id: actionPlanId },
    });

    if (!actionPlan) {
      return NextResponse.json({ error: "ActionPlan non trouvé." }, { status: 404 });
    }

    // 2. Lire le UserProfile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: userId || session.userId },
    });

    const niche = userProfile?.niche || "Business";
    const mainOffer = userProfile?.main_offer || "Prestation Premium";
    const targetAudience = userProfile?.target_audience || "Entrepreneurs";
    const priceRange = userProfile?.price_range || "1000€";

    const contentTypeUpper = (actionPlan.content_type || "REEL").toUpperCase();

    // 3. Gestion spécifique pour PROFILE / BIO (Tâche manuelle)
    if (contentTypeUpper.includes("PROFILE") || contentTypeUpper.includes("BIO")) {
      // Mettre à jour l'ActionPlan en base à 'done'
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
          cta: actionPlan.cta || "Mettre à jour le profil",
          tip: "Cette action doit être faite directement dans l'application Instagram. Copie les instructions et applique-les sur ton profil."
        }
      });
    }

    // 4. Choix de l'agent n8n
    const webhookUrl = WEBHOOK_MAP[contentTypeUpper] || process.env.N8N_VIDEO_WEBHOOK_URL;

    // 5. Créer l'AgentTask en base avec status: 'running'
    const agentTask = await prisma.agentTask.create({
      data: {
        userId: session.userId,
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

    // 6. Appeler le webhook n8n
    if (webhookUrl) {
      try {
        console.log(`Calling N8N Agent webhook: ${webhookUrl}`);
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: agentTask.id,
            user_id: session.userId,
            content_type: actionPlan.content_type,
            topic: actionPlan.topic,
            cta: actionPlan.cta || "",
            niche,
            main_offer: mainOffer,
            target_audience: targetAudience
          })
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json();
        // n8n sometimes returns wrapped array
        generatedResult = Array.isArray(data) ? data[0] : data;
        
        // Extract inner content if nested
        if (generatedResult && generatedResult.content) {
          generatedResult = generatedResult.content;
        }
      } catch (error: any) {
        console.error("Webhook failed, using direct AI fallback:", error);
        fallbackUsed = true;
      }
    } else {
      console.warn("No webhook URL set — using direct AI fallback");
      fallbackUsed = true;
    }

    // 7. En cas d'échec du webhook, générer le fallback AI
    if (fallbackUsed || !generatedResult) {
      generatedResult = await generateAIFallback(
        actionPlan.content_type,
        actionPlan.topic,
        actionPlan.cta || "",
        niche,
        mainOffer
      );
    }

    // 8. Enregistrer le GeneratedContent en base
    const content = await prisma.generatedContent.create({
      data: {
        userId: session.userId,
        agentTaskId: agentTask.id,
        type: actionPlan.content_type.toLowerCase(),
        content_json: generatedResult,
        status: "draft"
      }
    });

    // 9. Mettre à jour l'AgentTask et l'ActionPlan à 'done'
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
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
