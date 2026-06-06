import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = String(session.userId);

    const { id: tool } = await context.params;

    // console.debug("[TOOL] userId:", userId);
    // console.debug("[TOOL] tool:", tool);

    const body = await req.json() as Record<string, any>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    let content = "";

    switch (tool) {
      case "reel-script": {
        if (!body.topic) {
          return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
        }
        content = `[HOOK] Tu ne vas pas croire ce que j'ai découvert sur ${body.topic}...\n\n[CORPS] Voici les 3 secrets pour réussir dans ta niche.\n\n[CTA] Abonne-toi pour plus de conseils !`;
        break;
      }

      case "carousel": {
        if (!body.titre) {
          return NextResponse.json({ error: 'Missing titre' }, { status: 400 });
        }
        content = `Slide 1: Titre ${body.titre}\nSlide 2: Le problème\nSlide 3: La solution\nSlide 4: Exemple\nSlide 5: Résultat\nSlide 6: Astuce bonus\nSlide 7: Enregistre ce post !`;
        break;
      }

      case "quiz": {
        if (!body.sujet) {
          return NextResponse.json({ error: 'Missing sujet' }, { status: 400 });
        }
        content = `Question 1: Que signifie ${body.sujet} ?\nA) Choix 1\nB) Choix 2\nC) Choix 3\n\nRéponse correcte: A`;
        break;
      }

      case "caption": {
        if (!body.sujet || !body.ton) {
          return NextResponse.json({ error: 'Missing sujet or ton' }, { status: 400 });
        }
        content = `Voici un post captivant sur ${body.sujet}. Ton : ${body.ton}.\n\nLaisse un commentaire si tu es d'accord ! 👇`;
        break;
      }

      case "hashtags": {
        const niche = (body.niche || "business").replace(/\s+/g, "");
        const sujet = (body.sujet || "success").replace(/\s+/g, "");
        content = `#${niche} #${sujet} #viral #instagramtips`;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Tool not found" },
          { status: 404 }
        );
    }

    return NextResponse.json({
      success: true,
      result: content,
    });

  } catch (e: any) {
    console.error("[TOOL ERROR]", e);

    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}