import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, mode } = await req.json();

    // Check 14-day rule for "auto" mode
    if (mode === "auto") {
      // Find when the user first became 'semi' or their account creation date
      const prefs = await prisma.automationPrefs.findUnique({ where: { userId: session.userId } });
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      
      const creationDate = user?.createdAt || new Date();
      const diffTime = Math.abs(new Date().getTime() - creationDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays < 14) {
        return NextResponse.json({ 
          error: "Le mode Auto n'est activable qu'après 14 jours d'utilisation du mode Semi-Auto pour garantir la qualité." 
        }, { status: 403 });
      }
    }

    // Update UserProfile
    await prisma.userProfile.update({
      where: { userId: session.userId },
      data: { 
        ...(plan && { plan }),
        ...(plan === "libre" && { setup_done: true }),
      }
    });

    // Update AutomationPrefs
    if (mode) {
      const isAuto = mode === "auto";
      await prisma.automationPrefs.update({
        where: { userId: session.userId },
        data: { 
          mode,
          // If auto, turn on all automated toggles
          ...(isAuto && {
            generate_reels: true,
            generate_images: true,
            auto_publish: true,
            validation_mode: "auto"
          }),
          // If semi, enforce manual validation
          ...(mode === "semi" && {
            validation_mode: "manual"
          })
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Mode API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
