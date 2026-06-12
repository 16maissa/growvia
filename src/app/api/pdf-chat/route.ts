import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Pinecone } from "@pinecone-database/pinecone";
import { getSession } from "@/lib/auth";

function isCasualMessage(text: string): boolean {
  return /^(hi|hello|hey|bonjour|salut|bonsoir|merci|thank|thanks|ok|okay|bye|au revoir|ciao|sup|yo|hola|ça va|ca va|comment tu vas|comment vas-tu)\b/i.test(text.trim());
}

function isConfirmation(text: string): boolean {
  return /^\s*(oui|yes|y|ouais|go ahead|ok|okey|d'accord|sure|do it|exactement|ouep|yep|ouip|vas-y|allez|proceed)\s*[!.]?\s*$/i.test(text.trim());
}

function isDenial(text: string): boolean {
  return /^\s*(no|non|nope|non merci|no thanks|stop|annuler|cancel)\s*[!.]?\s*$/i.test(text.trim());
}

async function getEmbedding(text: string): Promise<number[] | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: text.slice(0, 500) }] },
        }),
      }
    );
    const data = await res.json();
    return data?.embedding?.values || null;
  } catch { return null; }
}

async function searchPinecone(question: string, userId: string, filterFileName?: string): Promise<string> {
  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME || "school-knowledge");
    const vector = await getEmbedding(question);
    if (!vector) return "";

    const queryOptions: any = { vector, topK: 10, includeMetadata: true };
    const filterConditions: any[] = [{ userId: { "$eq": userId } }];
    if (filterFileName) {
      filterConditions.push({ fileName: { "$in": [filterFileName] } });
    }
    queryOptions.filter = filterConditions.length === 1 ? filterConditions[0] : { "$and": filterConditions };

    const results = await index.query(queryOptions);
    const context = (results.matches || [])
      .filter((m: any) => m.score > 0.35)
      .map((m: any) => m.metadata?.text || m.metadata?.content || "")
      .filter(Boolean)
      .join("\n\n---\n\n");

    console.log(`[Pinecone] filter:${filterFileName || "ALL"} → ${results.matches?.length} matches`);
    return context;
  } catch (e: any) {
    console.log("[Pinecone] Error:", e.message);
    return "";
  }
}

async function askLLM(prompt: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY missing");

  const models = [
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-120b:free",
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
  ];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": "https://growvia.network",
          "X-Title": "Growvia PDF Chat",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1500,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!res.ok) continue;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content?.trim()) {
        console.log(`[LLM] ✅ ${model}`);
        return content.trim();
      }
    } catch { continue; }
  }
  throw new Error("All LLM models failed");
}

function buildRagPrompt(question: string, context: string, mode: "rag" | "general"): string {
  if (mode === "general") {
    return `You are a helpful assistant. Answer this question using your general knowledge.
Be clear, direct and professional. Do NOT mention PDFs or documents.

Question: ${question}

Start your response with the tag [GENERAL KNOWLEDGE MODE] on the first line, then answer.`;
  }

  return `You are a helpful assistant answering questions based on course documents.

=== DOCUMENT CONTENT ===
${context.slice(0, 6000)}
=== END ===

RULES:
- Answer ONLY from the content above.
- Be direct and professional.
- Naturally mention which document the answer comes from.
- If the answer is NOT in the content above, respond with exactly: NOT_FOUND

Question: ${question}`;
}

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = (session as any)?.userId;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json({ success: false, error: "Question required." }, { status: 400 });
    }

    const trimmedQuestion = question.trim();
    console.log(`\n[Chat] ─── "${trimmedQuestion}" ───`);

    // ── 1. Casual message ────────────────────────────────────────────────────
    if (isCasualMessage(trimmedQuestion)) {
      const answer = await askLLM(`You are a friendly PDF assistant. Reply naturally and briefly to: "${trimmedQuestion}"`);
      await prisma.chatMessage.create({ data: { question: trimmedQuestion, answer } });
      // __type: "final" → no Yes/No buttons
      return NextResponse.json({ success: true, answer, answerType: "final" });
    }

    // ── 2. Load history ──────────────────────────────────────────────────────
    const lastMessages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const isYes = isConfirmation(trimmedQuestion);
    const isNo  = isDenial(trimmedQuestion);

    // ── 3. NO → stop politely ────────────────────────────────────────────────
    if (isNo && lastMessages.length >= 1) {
      const answer = "Understood! Feel free to ask another question.";
      await prisma.chatMessage.create({ data: { question: trimmedQuestion, answer } });
      return NextResponse.json({ success: true, answer, answerType: "final" });
    }

    // ── 4. YES → act based on previous bot message ───────────────────────────
    if (isYes && lastMessages.length >= 1) {
      const previousAnswer = lastMessages[0].answer.toLowerCase();
      const originalQuestionObj = lastMessages.find(m => !isConfirmation(m.question) && !isDenial(m.question));
      const originalQuestion = originalQuestionObj?.question || trimmedQuestion;

      let answer = "";
      let answerType = "final";

      // YES to "search all documents"
      if (previousAnswer.includes("__ask_global")) {
        console.log("[Chat] YES → Global Pinecone search");
        const context = await searchPinecone(originalQuestion, userId);
        if (context) {
          const prompt = buildRagPrompt(originalQuestion, context, "rag");
          answer = await askLLM(prompt);
          if (answer.includes("NOT_FOUND")) {
            answer = "I couldn't find this information across all your documents either. Would you like me to answer from my general AI knowledge?";
            answerType = "ask_general";
          } else {
            answerType = "final";
          }
        } else {
          answer = "I couldn't find this information across all your documents. Would you like me to answer from my general AI knowledge?";
          answerType = "ask_general";
        }
      }
      // YES to "use general knowledge"
      else if (previousAnswer.includes("__ask_general")) {
        console.log("[Chat] YES → General LLM");
        answer = await askLLM(buildRagPrompt(originalQuestion, "", "general"));
        answerType = "final";
      }
      else {
        answer = "Could you clarify? Feel free to ask a new question.";
        answerType = "final";
      }

      await prisma.chatMessage.create({ data: { question: trimmedQuestion, answer } });
      return NextResponse.json({ success: true, answer: answer.replace(/__ask_\w+/g, ""), answerType });
    }

    // ── 5. Normal question flow ───────────────────────────────────────────────
    let answer = "";
    let n8nOk = false;

    const webhookUrl = process.env.N8N_PDF_CHAT_WEBHOOK_URL || "http://localhost:5678/webhook/pdf-agent";
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 25_000);
      const n8nRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion }),
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (n8nRes.ok) {
        const raw = await n8nRes.text();
        if (raw?.trim()) {
          try {
            const parsed = JSON.parse(raw);
            answer = parsed.answer || parsed.output || parsed.message || parsed.text || "";
          } catch { answer = raw.trim(); }
        }
      }
      console.log(`[Chat] n8n → ${answer.length} chars`);
    } catch (e: any) {
      console.log("[Chat] n8n:", e.name === "AbortError" ? "timeout" : e.message);
    }

    const isRealAnswer = answer?.trim() &&
      !answer.toLowerCase().includes("not_found") &&
      !answer.toLowerCase().includes("i don't know") &&
      !answer.toLowerCase().includes("could not find") &&
      !answer.toLowerCase().includes("je ne trouve pas") &&
      !answer.toLowerCase().includes("no relevant context");

    if (isRealAnswer) {
      n8nOk = true;
      console.log("[Chat] ✅ n8n answered");
    }

    // n8n failed → Pinecone direct fallback
    if (!n8nOk) {
      console.log("[Chat] Fallback → Pinecone + LLM");
      const context = await searchPinecone(trimmedQuestion, userId);

      if (context) {
        const prompt = buildRagPrompt(trimmedQuestion, context, "rag");
        answer = await askLLM(prompt);

        if (answer.includes("NOT_FOUND")) {
          // store marker so YES handler knows what to do
          const stored = "I couldn't find this information in your documents. Would you like me to search across all documents? __ask_global";
          await prisma.chatMessage.create({ data: { question: trimmedQuestion, answer: stored } });
          return NextResponse.json({ success: true, answer: "I couldn't find this information in your documents. Would you like me to search across all documents?", answerType: "ask_global" });
        }
      } else {
        const stored = "I couldn't find this information in your documents. Would you like me to search across all documents? __ask_global";
        await prisma.chatMessage.create({ data: { question: trimmedQuestion, answer: stored } });
        return NextResponse.json({ success: true, answer: "I couldn't find this information in your documents. Would you like me to search across all documents?", answerType: "ask_global" });
      }
    }

    await prisma.chatMessage.create({ data: { question: trimmedQuestion, answer } });
    return NextResponse.json({ success: true, answer, answerType: "final" });

  } catch (error: any) {
    console.error("[Chat] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
