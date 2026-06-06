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
          error: "Auto mode can only be activated after 14 days of using Semi-Auto mode to guarantee quality." 
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
          // If semi-auto, enforce manual validation
          ...(mode === "semi_auto" && {
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
