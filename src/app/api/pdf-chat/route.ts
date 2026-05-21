import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { success: false, error: "Question is required and must be a string." },
        { status: 400 }
      );
    }

    // 1. Fetch chat history to check if we are in a fallback state
    const lastMessages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 2,
    });

    let finalQuestionToSend = question;
    const isYes = question.toLowerCase().trim() === "oui" || question.toLowerCase().trim() === "yes";

    if (
      lastMessages.length === 2 &&
      lastMessages[0].answer.includes("connaissances générales") &&
      isYes
    ) {
      // The user agreed to use general knowledge for the PREVIOUS question
      const previousQuestion = lastMessages[1].question;
      finalQuestionToSend = `SYSTEM INSTRUCTION: Ignore the PDF completely. Answer this question using your general LLM knowledge: ${previousQuestion}`;
    }

    const webhookUrl = process.env.N8N_PDF_CHAT_WEBHOOK_URL || "http://localhost:5678/webhook/pdf-agent";

    // Forward the question to the n8n webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: finalQuestionToSend }),
    });

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to get an answer from the PDF agent." },
        { status: n8nResponse.status }
      );
    }

    const n8nRawText = await n8nResponse.text();
    let n8nData: any = {};
    
    if (n8nRawText.trim() === "") {
      console.log("=== [INFO] n8n a renvoyé un corps vide. ===");
      n8nData = { 
        success: true, 
        answer: "Je n'ai pas pu trouver cette information dans le PDF. Voulez-vous que je réponde avec mes connaissances générales ?" 
      };
    } else {
      try {
        n8nData = JSON.parse(n8nRawText);
      } catch (e) {
        n8nData = { 
          success: true, 
          answer: "Je n'ai pas pu trouver cette information dans le PDF. Voulez-vous que je réponde avec mes connaissances générales ?" 
        };
      }
    }

    let answer = n8nData.answer || n8nData.output || n8nData.message;

    // If n8n returns an error or a generic "I don't know" from Langchain
    if (!answer || answer.toLowerCase().includes("i don't know") || answer.toLowerCase().includes("not provided")) {
      answer = "Je n'ai pas pu trouver cette information dans le PDF. Voulez-vous que je réponde avec mes connaissances générales ?";
    }

    // Store the chat exchange in the database
    await prisma.chatMessage.create({
      data: {
        question,
        answer,
      },
    });

    return NextResponse.json({
      success: true,
      answer,
    }, { status: 200 });

  } catch (error: any) {
    console.error("PDF Chat Backend Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
