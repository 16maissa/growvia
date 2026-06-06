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
    const { courseId, bot_token, chat_id } = body;

    if (!courseId || !bot_token || !chat_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify course belongs to user
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.userId !== session.userId) {
      return NextResponse.json({ error: "Course not found or unauthorized" }, { status: 404 });
    }

    // Validate bot token via Telegram getMe API
    const telegramRes = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      return NextResponse.json({ success: false, error: "Invalid Telegram Bot Token" });
    }

    const bot_name = telegramData.result.first_name;

    // Save to course
    await prisma.course.update({
      where: { id: courseId },
      data: {
        telegram_bot_token: bot_token,
        telegram_chat_id: chat_id,
        telegram_bot_active: true,
      },
    });

    return NextResponse.json({ success: true, bot_name });
  } catch (error) {
    console.error("Configure Telegram Error:", error);
    return NextResponse.json({ error: "Failed to configure telegram" }, { status: 500 });
  }
}
