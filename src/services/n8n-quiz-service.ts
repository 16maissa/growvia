import { Pinecone } from "@pinecone-database/pinecone";

export type QuizQuestion = {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer?: string;
};

async function getEmbedding(text: string): Promise<number[] | null> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!GEMINI_KEY) {
    console.log("[Embed] No GEMINI_API_KEY found — skipping embedding");
    return null;
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
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
    if (!res.ok) {
      console.log("[Embed] Gemini error:", JSON.stringify(data).slice(0, 200));
      return null;
    }
    const vector = data?.embedding?.values;
    if (!vector) {
      console.log("[Embed] Unexpected response:", JSON.stringify(data).slice(0, 200));
      return null;
    }
    console.log(`[Embed] Gemini embedding OK (${vector.length} dims)`);
    return vector;
  } catch (e: any) {
    console.log("[Embed] Error:", e.message);
    return null;
  }
}

async function fetchPineconeContext(fileNames: string[], promptText: string): Promise<string> {
  try {
    const PINECONE_KEY = process.env.PINECONE_API_KEY;
    if (!PINECONE_KEY) {
      console.log("[Pinecone] PINECONE_API_KEY missing — skipping RAG");
      return "";
    }

    const vector = await getEmbedding(promptText);
    if (!vector) {
      console.log("[Pinecone] No embedding — skipping RAG");
      return "";
    }

    const pinecone = new Pinecone({ apiKey: PINECONE_KEY });
    const indexName = process.env.PINECONE_INDEX_NAME || "school-knowledge";
    const index = pinecone.index(indexName);

    const queryOptions: any = { vector, topK: 15, includeMetadata: true };
    if (fileNames.length > 0) {
      queryOptions.filter = { fileName: { "$in": fileNames } };
    }

    const results = await index.query(queryOptions);
    const context = (results.matches || [])
      .filter((m: any) => m.score > 0.3)
      .map((m: any) => m.metadata?.text || m.metadata?.content || "")
      .filter(Boolean)
      .join("\n\n---\n\n");

    console.log(`[Pinecone] ${results.matches?.length} matches, context: ${context.length} chars`);
    return context;
  } catch (e: any) {
    console.log("[Pinecone] Error (continuing without RAG):", e.message);
    return "";
  }
}

function buildFullPrompt(
  fileNames: string[],
  totalQuestions: number,
  easyCount: number,
  mediumCount: number,
  hardCount: number,
  choicesCount: number,
  context: string
): string {
  const contextSection = context
    ? `\n\n=== COURSE CONTENT (your ONLY source) ===\n${context.slice(0, 8000)}\n=== END OF CONTENT ===`
    : "";

  return `ACT AS A STRICT AUTOMATED EXAM GENERATOR (DYNAMIC MODE).
${contextSection}

### 1. INPUT ANALYSIS & QUANTITY:
- Sources: ${fileNames.map(f => `[${f}]`).join(", ")}
- QUANTITY: Generate EXACTLY ${totalQuestions} questions total:
  * ${easyCount} Easy questions
  * ${mediumCount} Medium questions
  * ${hardCount} Hard questions
- OPTIONS: Exactly ${choicesCount} options per question.
- LANGUAGE: Match the language of the course content above.

### 2. DEEP SCANNING (The 10/50/90 Rule):
- Extract questions from START (foundations), MIDDLE (mechanisms), and END (advanced).
- If multiple files: distribute questions equally and interleave them.

### 3. PEDAGOGICAL INTEGRITY:
- NEVER mention filenames, "the PDF", or "the document" in questions.
- Write like a real professor about the SUBJECT, not about the file.
- WRONG: "According to bda.pdf, what is Hibernate?"
- RIGHT: "In the context of persistence layers, what is the primary role of Hibernate?"
- NO REPETITION of the same concept.

### 4. OUTPUT FORMAT (STRICT):
Return ONLY a valid JSON array. NO markdown, NO code fences, NO extra text.
[
  {
    "id": 1,
    "questionText": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": "option A"
  }
]`;
}

async function callLLMDirectly(
  fileNames: string[],
  totalQuestions: number,
  easyCount: number,
  mediumCount: number,
  hardCount: number,
  choicesCount: number
): Promise<QuizQuestion[]> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY missing");

  console.log("[Fallback] Fetching Pinecone context...");
  const context = await fetchPineconeContext(fileNames, fileNames.join(" "));
  const fullPrompt = buildFullPrompt(fileNames, totalQuestions, easyCount, mediumCount, hardCount, choicesCount, context);

  const models = [
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-120b:free",
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
  ];

  let lastError = "";
  for (const model of models) {
    console.log(`[Fallback] Trying: ${model}`);
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 180_000);

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://growvia.network",
          "X-Title": "Growvia Quiz Generator",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: fullPrompt }],
          temperature: 0.2,
          max_tokens: 4000,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!res.ok) {
        console.log(`[Fallback] ${model} -> HTTP ${res.status}`);
        lastError = `${model}: HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content?.trim()) { lastError = `${model}: empty response`; continue; }

      console.log(`[Fallback] OK ${model}`);
      return parseQuizJSON(content);
    } catch (e: any) {
      if (e.name === "AbortError") console.log(`[Fallback] ${model} -> timeout`);
      lastError = e.message;
      continue;
    }
  }
  throw new Error(`All fallback models failed. Last error: ${lastError}`);
}

function parseQuizJSON(raw: string): QuizQuestion[] {
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const arrayMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) raw = arrayMatch[0];

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    let repaired = raw;
    const opens  = (repaired.match(/\{/g) || []).length;
    const closes = (repaired.match(/\}/g) || []).length;
    const openA  = (repaired.match(/\[/g) || []).length;
    const closeA = (repaired.match(/\]/g) || []).length;
    if (opens  > closes) repaired += "}".repeat(opens - closes);
    if (openA  > closeA) repaired += "]";
    data = JSON.parse(repaired);
  }

  if (!Array.isArray(data)) data = data.questions || data.quiz || data.output || [data];

  return data
    .map((item: any, i: number) => ({
      id: item.id || i + 1,
      questionText: item.questionText || item.question || "",
      options: Array.isArray(item.options) ? item.options : [],
      correctAnswer: item.correctAnswer || item.answer || "",
    }))
    .filter((q: any) => q.questionText && q.options.length > 0);
}

export async function generateQuizFromN8n(
  selectedFiles: string[],
  totalQuestions: number,
  easyCount: number,
  mediumCount: number,
  hardCount: number,
  choicesCount: number
): Promise<QuizQuestion[]> {
  const webhookUrl = process.env.N8N_QUIZ_WEBHOOK_URL || "http://localhost:5678/webhook/generate-quiz";
  const fileNamesString = selectedFiles.map(f => `[${f}]`).join(", ");

  const n8nPrompt = `Generate a quiz from: ${fileNamesString}. Total: ${totalQuestions} questions (${easyCount} Easy, ${mediumCount} Medium, ${hardCount} Hard). Each question has exactly ${choicesCount} options. Return ONLY a raw JSON array: [{"id":1,"questionText":"...","options":["A","B","C","D"],"correctAnswer":"..."}]`;

  console.log(`=== [Quiz] n8n attempt (${totalQuestions} questions) ===`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("[Quiz] n8n 4min timeout -> aborting");
      controller.abort();
    }, 240_000);

    const start = Date.now();
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatInput: n8nPrompt }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log(`[Quiz] n8n responded in ${((Date.now() - start) / 1000).toFixed(1)}s — HTTP ${response.status}`);

    if (response.ok) {
      const rawText = await response.text();
      if (rawText?.trim()) {
        try {
          const questions = parseQuizJSON(rawText);
          if (questions.length > 0) {
            console.log(`=== [Quiz] n8n success (${questions.length} questions) ===`);
            return questions;
          }
          console.log("[Quiz] n8n returned 0 questions -> fallback");
        } catch {
          console.log("[Quiz] n8n invalid JSON -> fallback");
        }
      } else {
        console.log("[Quiz] n8n empty body -> fallback");
      }
    } else {
      console.log(`[Quiz] n8n HTTP ${response.status} -> fallback`);
    }
  } catch (e: any) {
    console.log("[Quiz] n8n error:", e.name === "AbortError" ? "timeout" : e.message, "-> fallback");
  }

  console.log("=== [Quiz] Activating fallback (Pinecone + LLM) ===");
  return callLLMDirectly(selectedFiles, totalQuestions, easyCount, mediumCount, hardCount, choicesCount);
}
