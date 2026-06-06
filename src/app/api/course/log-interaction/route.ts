import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const internalToken = process.env.SAAS_INTERNAL_TOKEN;

    if (!internalToken || authHeader !== `Bearer ${internalToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, question, answer, student_name, chat_id } = body;

    if (!courseId || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const interaction = await prisma.telegramInteraction.create({
      data: {
        courseId,
        question,
        answer,
        student_name,
        chat_id,
        answered_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: interaction.id });
  } catch (error) {
    console.error("Log Interaction Error:", error);
    return NextResponse.json({ error: "Failed to log interaction" }, { status: 500 });
  }
}
