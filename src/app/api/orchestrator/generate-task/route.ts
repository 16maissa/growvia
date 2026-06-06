import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateSingleTask } from "@/lib/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const result = await generateSingleTask(session.userId, taskId);

    if (result.success) {
      return NextResponse.json({ success: true, preview_url: result.preview_url, content: result.content });
    } else if (result.skipped) {
      return NextResponse.json({ success: false, error: result.reason || "Skipped" });
    } else {
      return NextResponse.json({ success: false, error: result.error || "Generation failed" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Generate Task API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
