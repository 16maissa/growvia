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
    const isYes = /\b(oui|yes|y|ouais|go ahead|ok|okey|d'accord|sure|do it)\b/i.test(question.trim());

    if (lastMessages.length === 2 && isYes) {
      const previousAnswer = lastMessages[0].answer.toLowerCase();
      const previousQuestion = lastMessages[1].question;

      if (previousAnswer.includes("search across all other documents") || previousAnswer.includes("tous les autres documents")) {
        // Rebound 1: Search across all documents
        finalQuestionToSend = `SYSTEM INSTRUCTION: Search across ALL documents in the database to answer this question: ${previousQuestion}`;
      } else if (previousAnswer.includes("general ai knowledge") || previousAnswer.includes("connaissances générales") || previousAnswer.includes("general knowledge")) {
        // Rebound 2: Use general knowledge
        finalQuestionToSend = `SYSTEM INSTRUCTION: Ignore the PDF completely. Answer this question using your general LLM knowledge: ${previousQuestion}`;
      }
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
        success: false, 
        answer: isYes 
          ? "[Erreur Système] Je n'ai pas pu générer la réponse. La limite de requêtes (tokens) a probablement été atteinte sur votre compte Gemini, ou n8n a planté." 
          : "I couldn't find this information in your uploaded documents. Would you like me to answer using my general AI knowledge instead?" 
      };
    } else {
      try {
        n8nData = JSON.parse(n8nRawText);
      } catch (e) {
        n8nData = { 
          success: false, 
          answer: isYes 
            ? "[Erreur Système] Je n'ai pas pu générer la réponse. La limite de requêtes (tokens) a probablement été atteinte sur votre compte Gemini, ou n8n a planté." 
            : "I couldn't find this information in your uploaded documents. Would you like me to answer using my general AI knowledge instead?" 
        };
      }
    }

    let answer = n8nData.answer || n8nData.output || n8nData.message;

    // If n8n returns an error or a generic "I don't know" from Langchain
    if (!answer || answer.toLowerCase().includes("i don't know") || answer.toLowerCase().includes("not provided")) {
      answer = isYes 
        ? "[Erreur Système] Impossible de répondre. La limite de requêtes (tokens) a probablement été atteinte sur votre compte Gemini."
        : "I couldn't find this information in your uploaded documents. Would you like me to answer using my general AI knowledge instead?";
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
