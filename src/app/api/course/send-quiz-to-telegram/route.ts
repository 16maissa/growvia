import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, namespace } = body;

    if (!courseId || !namespace) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.userId !== session.userId) {
      return NextResponse.json({ error: "Course not found or unauthorized" }, { status: 404 });
    }

    if (!course.telegram_chat_id || !course.telegram_bot_active) {
      return NextResponse.json({ error: "Telegram is not fully configured for this course" }, { status: 400 });
    }

    const quizWebhook = process.env.N8N_QUIZ_WEBHOOK_URL;
    const sendWebhook = process.env.N8N_WEBHOOK_SEND_TO_TELEGRAM;

    if (!quizWebhook || !sendWebhook) {
      return NextResponse.json({ error: "Webhooks not configured" }, { status: 500 });
    }

    // 1. Generate Quiz
    const quizRes = await fetch(quizWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.userId,
        namespace,
      }),
    });

    if (!quizRes.ok) {
      throw new Error("Failed to generate quiz from n8n");
    }

    const quizData = await quizRes.json();
    const generatedQuiz = quizData.content || quizData;

    // Determine the format (assuming n8n returns standard quiz format)
    // If it's a string, we just send as text. If it has structure, we map it.
    let question = generatedQuiz.question || "Quiz";
    let options = generatedQuiz.options || [];
    let correct_index = generatedQuiz.correct_index || 0;

    // 2. Send to Telegram via n8n send webhook
    const sendRes = await fetch(sendWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "quiz",
        question,
        options,
        correct_index,
        chat_id: course.telegram_chat_id,
      }),
    });

    if (!sendRes.ok) {
      throw new Error("Failed to push quiz to Telegram");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send Quiz Error:", error);
    return NextResponse.json({ error: "Failed to send quiz to telegram" }, { status: 500 });
  }
}
