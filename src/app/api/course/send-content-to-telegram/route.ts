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
    const { courseId, text } = body;

    if (!courseId || !text) {
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

    const webhookUrl = process.env.N8N_WEBHOOK_SEND_TO_TELEGRAM;
    if (!webhookUrl) {
      console.error("N8N_WEBHOOK_SEND_TO_TELEGRAM is missing from env");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "message",
        text,
        chat_id: course.telegram_chat_id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send to Telegram Webhook: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send Content Error:", error);
    return NextResponse.json({ error: "Failed to send content to telegram" }, { status: 500 });
  }
}
