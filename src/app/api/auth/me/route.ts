import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    console.log("[ME] request");

    const session = await getSession(req);

    console.log("[ME] session:", session);

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔥 FIX IMPORTANT: Prisma ID must be string safe
    const userId = String(session.userId);

    console.log("[ME] userId:", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: true,
        automationPrefs: true,
      },
    });

    if (!user) {
      console.log("[ME] user not found in DB");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { password, ...safeUser } = user;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (err) {
    console.error("[ME ERROR]", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}