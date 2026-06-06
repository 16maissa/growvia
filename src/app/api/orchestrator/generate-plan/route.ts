import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generatePlan } from "@/lib/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { niche, audience, goals, preferences } = await req.json();

    const plan = await generatePlan(session.userId, { niche, audience, goals, preferences });

    return NextResponse.json({ tasks: plan.tasks });
  } catch (error: any) {
    console.error("Generate Plan API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
