import { NextRequest, NextResponse } from "next/server";
import { runOrchestrator } from "@/lib/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const result = await runOrchestrator(user_id);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Orchestrator API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
