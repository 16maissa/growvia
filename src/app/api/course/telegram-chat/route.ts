import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const internalToken = process.env.SAAS_INTERNAL_TOKEN;

    if (!internalToken || authHeader !== `Bearer ${internalToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { question, chat_id } = body;

    if (!question) {
      return NextResponse.json(
        { error: "Question required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      process.env.N8N_TELEGRAM_CHAT_WEBHOOK_URL!,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          chat_id,
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("[TELEGRAM CHAT ERROR]", error);

    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}