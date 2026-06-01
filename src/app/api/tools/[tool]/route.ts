import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tool: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tool } = await context.params;
    const body = await req.json();

    const userProfile = await prisma.userProfile.findUnique({ where: { userId: session.userId } });
    if (!userProfile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // TODO: For "libre" plan, implement decrementation logic here in the database

    let content = "";
    switch (tool) {
      case "reel-script":
        content = `[HOOK] Tu ne vas pas croire ce que j'ai découvert sur ${body.topic}...\n\n[CORPS] Voici les 3 secrets pour réussir dans ta niche.\n\n[CTA] Abonne-toi pour plus de conseils !`;
        break;
      case "carousel":
        content = `Slide 1: Titre ${body.titre}\nSlide 2: Le problème\nSlide 3: La solution\nSlide 4: Exemple\nSlide 5: Résultat\nSlide 6: Astuce bonus\nSlide 7: Enregistre ce post !`;
        break;
      case "quiz":
        content = `Question 1: Que signifie ${body.sujet} ?\nA) Choix 1\nB) Choix 2\nC) Choix 3\n\nRéponse correcte: A`;
        break;
      case "caption":
        content = `Voici un post captivant sur ${body.sujet}. Ton : ${body.ton}.\n\nLaisse un commentaire si tu es d'accord ! 👇`;
        break;
      case "hashtags":
        content = `#${(body.niche || "business").replace(/\s+/g, '')} #${(body.sujet || "success").replace(/\s+/g, '')} #viral #instagramtips`;
        break;
      default:
        return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, result: content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
