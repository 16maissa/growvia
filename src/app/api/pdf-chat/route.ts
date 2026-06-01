import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { success: false, error: "La question est requise et doit être une chaîne de caractères." },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    console.log(`[CHAT API] Production Request Received. Question: "${trimmedQuestion}"`);

    // On récupère les 10 derniers échanges pour assurer un historique large et retrouver la question d'origine
    const lastMessages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    let finalQuestionToSend = trimmedQuestion;
    
    // Expression régulière robuste pour intercepter toutes les variations d'accord (Yes/Oui/Ok)
    const isYes = /\b(oui|yes|y|ouais|go ahead|ok|okey|d'accord|sure|do it|exactement|ouep|yep|ouip)\b/i.test(trimmedQuestion);

    if (lastMessages.length >= 1 && isYes) {
      const previousAnswer = lastMessages[0].answer;
      const previousAnswerLower = previousAnswer.toLowerCase();

      // On retrouve la vraie question technique d'origine posée avant la suite de confirmations "Yes" / "Oui"
      const originalQuestionObj = lastMessages.find(m => 
        !/\b(oui|yes|y|ouais|go ahead|ok|okey|d'accord|sure|do it|exactement|ouep|yep|ouip)\b/i.test(m.question.trim())
      );
      const originalQuestion = originalQuestionObj ? originalQuestionObj.question : trimmedQuestion;

      // STEP 2 MATCH: Si le bot avait proposé d'élargir la recherche à toute la base de données
      if (previousAnswerLower.includes("search across all other") || previousAnswerLower.includes("autres documents")) {
        finalQuestionToSend = `[SYSTEM INSTRUCTION - GLOBAL SEARCH]: Search and answer this question across ALL uploaded documents in the database: "${originalQuestion}"`;
      } 
      // STEP 3 MATCH: Si le bot avait proposé de basculer sur ses connaissances générales de l'IA
      else if (
        previousAnswerLower.includes("general ai") || 
        previousAnswerLower.includes("connaissances générales") || 
        previousAnswerLower.includes("general knowledge")
      ) {
        finalQuestionToSend = `[SYSTEM INSTRUCTION - GENERAL KNOWLEDGE]: Ignore the PDF vectors completely. Act as a helpful assistant and answer this question using your general LLM knowledge: "${originalQuestion}"`;
      }
    }

    const webhookUrl = process.env.N8N_PDF_CHAT_WEBHOOK_URL || "http://localhost:5678/webhook/pdf-agent";
    console.log(`[CHAT API] Forwarding to n8n Webhook: ${webhookUrl}`);
    
    let answer = "";
    let n8nFetchError = null;

    try {
      // Configuration d'un timeout de fetch pour éviter les suspens infinis en production
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout limit

      const n8nResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQuestionToSend }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!n8nResponse.ok) {
        throw new Error(`n8n responded with status ${n8nResponse.status}`);
      }

      const n8nRawText = await n8nResponse.text();
      console.log(`[CHAT API] Raw response length from n8n: ${n8nRawText.length} chars.`);
      
      if (n8nRawText.trim() === "") {
        throw new Error("Empty response from n8n");
      }

      // Parseur intelligent et ultra-résistant pour tous les formats d'objets JSON ou de texte brut
      try {
        const n8nData = JSON.parse(n8nRawText);
        // On inspecte toutes les clés courantes de retour d'agents (n8n/langchain)
        answer = n8nData.answer || 
                 n8nData.output || 
                 n8nData.message || 
                 n8nData.text || 
                 n8nData.response || 
                 n8nData.result || 
                 (typeof n8nData === "string" ? n8nData : "");
                 
        // Si c'est un objet parsé valide mais sans clé évidente, on extrait la valeur textuelle
        if (!answer && typeof n8nData === "object") {
          answer = JSON.stringify(n8nData);
        }
      } catch (e) {
        // Si le parseur JSON échoue, cela signifie que la réponse n8n est une chaîne de texte brut
        answer = n8nRawText.trim();
      }

    } catch (err: any) {
      n8nFetchError = err;
      console.error("[CHAT API] Error communicating with n8n workflow:", err);
    }

    // Analyse approfondie pour détecter un échec réel ou une réponse vide de Pinecone
    const isAnswerEmpty = !answer || 
                          answer.trim() === "" || 
                          answer.toLowerCase().includes("i don't know") || 
                          answer.toLowerCase().includes("not provided") ||
                          answer.toLowerCase().includes("could not find") ||
                          answer.toLowerCase().includes("je ne trouve pas") ||
                          answer.toLowerCase().includes("no relevant context found");

    if (isAnswerEmpty || n8nFetchError) {
      console.log(`[CHAT API] Activating Fallback state machine. Empty: ${isAnswerEmpty}, Error: ${!!n8nFetchError}`);
      
      if (isYes) {
        // Step 3 Fallback : Proposer l'utilisation du LLM général
        answer = "I couldn't find this information in your uploaded documents. Would you like me to answer using my general AI knowledge instead?";
      } else {
        // Step 2 Fallback : Proposer la recherche globale sur toute la base de données
        answer = "I couldn't find this information in your uploaded documents. Would you like me to search across all other documents in the database?";
      }
    }

    // Stockage systématique de l'échange pour maintenir l'historique
    await prisma.chatMessage.create({
      data: {
        question: trimmedQuestion,
        answer: answer,
      },
    });

    return NextResponse.json({
      success: true,
      answer,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CHAT API] Critical Internal Server Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne du serveur de chat" },
      { status: 500 }
    );
  }
}