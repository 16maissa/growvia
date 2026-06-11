import { NextRequest, NextResponse } from "next/server";
import { getBot } from "@/lib/telegram/bot";
import { generateAnswer } from "@/lib/telegram/rag";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message?.text) return NextResponse.json({ ok: true });

    const chatId = message.chat.id.toString();
    const username = message.from?.username || message.from?.first_name || "étudiant";
    const userText = message.text;

    if (userText.startsWith("/")) return NextResponse.json({ ok: true });

    console.log(`📨 Message de @${username}: ${userText}`);

    // Trouver le cours lié à ce chat Telegram
    const course = await prisma.course.findFirst({
      where: { telegram_chat_id: chatId, telegram_bot_active: true },
    });

    const answer = await generateAnswer(userText);

    // Sauvegarder dans TelegramInteraction
    if (course) {
      await prisma.telegramInteraction.create({
        data: {
          courseId: course.id,
          chat_id: chatId,
          student_name: username,
          question: userText,
          answer: answer,
          answered_at: new Date(),
        },
      });
    } else {
      console.warn("⚠️ Aucun cours trouvé pour chat_id:", chatId);
    }

    await getBot().telegram.sendMessage(chatId, answer, {
      reply_parameters: { message_id: message.message_id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ TELEGRAM WEBHOOK ERROR:", error);
    try {
      await getBot().telegram.sendMessage(
        process.env.TELEGRAM_ADMIN_CHAT_ID!,
        `🚨 Erreur webhook:\n${(error as Error).message}`
      );
    } catch {}
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
