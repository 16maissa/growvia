import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generatePlan } from "@/lib/orchestrator";

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

    console.log("[PLAN] userId:", userId);

    const { niche, audience, goals, preferences } = await req.json();

    if (!niche || !audience) {
      return NextResponse.json(
        { error: "Missing required fields (niche, audience)" },
        { status: 400 }
      );
    }

    const plan = await generatePlan(userId, {
      niche,
      audience,
      goals,
      preferences,
    });

    console.log("[PLAN] generated tasks:", plan?.tasks?.length);

    return NextResponse.json({
      success: true,
      tasks: plan.tasks,
    });

  } catch (error: any) {
    console.error("[GENERATE PLAN ERROR]", error);

    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}