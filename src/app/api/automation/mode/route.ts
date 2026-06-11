import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = String(session.userId);

    console.log("[MODE] userId:", userId);

    const { plan, mode } = await req.json();

    if (!plan && !mode) {
      return NextResponse.json(
        { error: "Missing plan or mode" },
        { status: 400 }
      );
    }

    // Check 14-day rule for "auto" mode
    if (mode === "auto") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.createdAt) {
        return NextResponse.json(
          { error: "User creation date not found" },
          { status: 404 }
        );
      }

      const creationDate = new Date(user.createdAt);

      const diffTime = Date.now() - creationDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      console.log("[MODE] account age days:", diffDays);

      if (diffDays < 14) {
        return NextResponse.json(
          {
            error:
              "Auto mode can only be activated after 14 days of usage (Semi-Auto required).",
          },
          { status: 403 }
        );
      }
    }

    // Update UserProfile
    await prisma.userProfile.update({
      where: { userId },
      data: {
        ...(plan && { plan }),
        ...(plan === "libre" && { setup_done: true }),
      },
    });

    // Update AutomationPrefs
    if (mode) {
      const isAuto = mode === "auto";

      await prisma.automationPrefs.update({
        where: { userId },
        data: {
          mode,

          ...(isAuto && {
            generate_reels: true,
            generate_images: true,
            auto_publish: true,
            validation_mode: "auto",
          }),

          ...(mode === "semi_auto" && {
            validation_mode: "manual",
          }),
        },
      });
    }

    // Refresh JWT token with updated plan
    const updatedProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const updatedPrefs = await prisma.automationPrefs.findUnique({ where: { userId } });
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const newToken = await encrypt({
      userId,
      email: updatedUser?.email,
      plan: updatedProfile?.plan ?? "libre",
      setup_done: updatedProfile?.setup_done ?? false,
    });
    const response = NextResponse.json({
      success: true,
      userId,
      plan: updatedProfile?.plan,
      mode: updatedPrefs?.mode,
    });
    response.cookies.set("session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error: any) {
    console.error("[MODE ERROR]", error);

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}