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

    const userId = String(session.userId);

    console.log("[GENERATE] userId:", userId);
    console.log("[GENERATE] taskId:", taskId);

    const result = await generateSingleTask(userId, taskId);

    console.log("[GENERATE] result:", result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        preview_url: result.preview_url,
        content: result.content,
      });
    }

    if (result.skipped) {
      return NextResponse.json({
        success: false,
        error: result.reason || "Skipped",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || "Generation failed",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("[GENERATE TASK ERROR]", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}