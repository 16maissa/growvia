import { NextRequest, NextResponse } from "next/server";
import { getBot } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.SAAS_INTERNAL_TOKEN}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, chat_id, content } = await req.json();

    if (type === "message") {
      await getBot().telegram.sendMessage(chat_id, content.text, { parse_mode: "Markdown" });
    } else if (type === "quiz") {
      const { question, options, correct_index } = content;
      // Telegram native quiz poll (auto-corrected)
      await (getBot().telegram as any).sendPoll(
        chat_id,
        question.slice(0, 300),
        options.map((o: string) => o.slice(0, 100)),
        {
          type: "quiz",
          correct_option_id: correct_index >= 0 ? correct_index : 0,
          is_anonymous: true,
        }
      );
    } else if (type === "document") {
      const { file_url, filename, caption } = content;
      await getBot().telegram.sendDocument(chat_id, { url: file_url, filename }, { caption: caption || filename });
    } else if (type === "html_file") {
      const { html_content, filename, caption } = content;
      const buffer = Buffer.from(html_content, "utf-8");
      await getBot().telegram.sendDocument(
        chat_id,
        { source: buffer, filename: filename || "Training_Course.html" },
        { caption: caption || "📄 Cours généré automatiquement" }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ TELEGRAM SEND ERROR:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
