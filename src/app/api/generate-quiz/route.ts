import { NextRequest, NextResponse } from "next/server";
import { generateQuizFromN8n } from "@/services/n8n-quiz-service";
import { getSession } from "@/lib/auth";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = (session as any)?.userId;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { selectedFiles, totalQuestions, easyCount, mediumCount, hardCount, choicesCount } = body;

    if (!selectedFiles || !Array.isArray(selectedFiles) || selectedFiles.length === 0) {
      return NextResponse.json({ success: false, error: "At least one PDF file must be selected." }, { status: 400 });
    }

    if (totalQuestions !== (easyCount + mediumCount + hardCount)) {
      return NextResponse.json({ success: false, error: "Total questions must equal the sum of Easy, Medium, and Hard." }, { status: 400 });
    }

    const questions = await generateQuizFromN8n(
      selectedFiles,
      totalQuestions,
      easyCount,
      mediumCount,
      hardCount,
      choicesCount,
      userId
    );

    return NextResponse.json({ success: true, questions }, { status: 200 });

  } catch (error: any) {
    console.error("Quiz API Route Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
