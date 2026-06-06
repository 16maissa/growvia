import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    console.log("[ME] request received");

    // ✅ FIX: no req passed
    const session = await getSession();

    console.log("[ME] session decoded:", session);

    if (!session || !session.userId) {
      console.log("[ME] unauthorized - no session");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ normalize id safely
    const userId = String(session.userId);

    console.log("[ME] fetching user:", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProfile: true,
        automationPrefs: true,
      },
    });

    if (!user) {
      console.log("[ME] user NOT FOUND in database");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // remove password safely
    const { password, ...safeUser } = user;

    console.log("[ME] success user returned");

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (err) {
    console.error("[ME ERROR]", err);

    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}