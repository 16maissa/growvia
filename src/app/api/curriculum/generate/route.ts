import { NextRequest, NextResponse } from "next/server";
import { withWebhookLock } from "@/lib/webhook-lock";
import { Pinecone } from "@pinecone-database/pinecone";
import { getSession } from "@/lib/auth";

export const maxDuration = 300;

// ── Gemini embedding ──────────────────────────────────────────────────────────
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

// ── Pinecone context fetch ────────────────────────────────────────────────────
async function fetchPineconeContext(fileNames: string[], userId: string): Promise<string> {
  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME || "school-knowledge");

    const queryText = `training course content from ${fileNames.join(", ")}`;
    const vector = await getEmbedding(queryText);
    if (!vector) return "";

    const queryOptions: any = { vector, topK: 20, includeMetadata: true };
    const filterConditions: any[] = [{ userId: { "$eq": userId } }];
    if (fileNames.length > 0) {
      filterConditions.push({ fileName: { "$in": fileNames } });
    }
    queryOptions.filter = filterConditions.length === 1 ? filterConditions[0] : { "$and": filterConditions };

    const results = await index.query(queryOptions);
    const context = (results.matches || [])
      .filter((m: any) => m.score > 0.3)
      .map((m: any) => m.metadata?.text || m.metadata?.content || "")
      .filter(Boolean)
      .join("\n\n---\n\n");

    console.log(`[Pinecone] ${results.matches?.length} matches, ${context.length} chars`);
    return context;
  } catch (e: any) {
    console.log("[Pinecone] Error:", e.message);
    return "";
  }
}

// ── Direct LLM fallback via OpenRouter ───────────────────────────────────────
async function generateCurriculumWithLLM(
  files: string[],
  age: number,
  difficulty: string,
  context: string
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY missing");

  const models = [
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-120b:free",
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
  ];

  const difficultyLabel = { beginner: "Simple analogies, real-world examples", medium: "Balanced technical and instructional", advanced: "Full depth, formulas, deep dives" }[difficulty] || "Balanced";

  const prompt = `You are an expert curriculum designer. Create a complete training course as a single HTML document.

=== SOURCE CONTENT ===
${context.slice(0, 8000)}
=== END ===

REQUIREMENTS:
- Target age: ${age} years old
- Difficulty: ${difficulty} (${difficultyLabel})
- Sources: ${files.join(", ")}
- Language: match the language of the source content

OUTPUT: A complete, beautiful, self-contained HTML document with:
- Inline CSS styling (professional, clean design with blue theme)
- Proper headings (h1, h2, h3)
- Sections: Introduction, Main Chapters (from content), Summary, Key Takeaways
- Tables where relevant
- A footer with "Training School Automated Curriculum"

CRITICAL: Return ONLY the raw HTML. Start with <!DOCTYPE html> or <html>. No markdown, no explanation.`;

  let lastError = "";
  for (const model of models) {
    console.log(`[Curriculum Fallback] Trying: ${model}`);
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 180_000);

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": "https://growvia.network",
          "X-Title": "Growvia Curriculum Builder",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 8000,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);

      if (!res.ok) {
        console.log(`[Curriculum Fallback] ${model} → HTTP ${res.status}`);
        lastError = `${model}: HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content?.trim()) { lastError = `${model}: empty`; continue; }

      // Clean markdown fences if LLM added them
      const html = content
        .replace(/^```html\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      if (!html.includes("<html") && !html.includes("<!DOCTYPE")) {
        lastError = `${model}: not valid HTML`;
        continue;
      }

      console.log(`[Curriculum Fallback] ✅ ${model} → ${html.length} chars`);
      return html;

    } catch (e: any) {
      if (e.name === "AbortError") console.log(`[Curriculum Fallback] ${model} → timeout`);
      lastError = e.message;
      continue;
    }
  }
  throw new Error(`All fallback models failed. Last: ${lastError}`);
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = (session as any)?.userId;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { files, age, difficulty } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ success: false, error: "At least one PDF file must be selected." }, { status: 400 });
    }
    if (!age || isNaN(Number(age)) || Number(age) < 6 || Number(age) > 18) {
      return NextResponse.json({ success: false, error: "Target age must be between 6 and 18." }, { status: 400 });
    }
    if (!["beginner", "medium", "advanced"].includes(difficulty)) {
      return NextResponse.json({ success: false, error: "Invalid difficulty level." }, { status: 400 });
    }

    const webhookUrl = process.env.N8N_CURRICULUM_WEBHOOK_URL || "http://localhost:5678/webhook/generate-course-synthesis";
    const payload = { files, age: Number(age), difficulty };
    console.log("=== [Curriculum] Sending to n8n:", JSON.stringify(payload));

    // ── Try n8n first ──
    let htmlResult: string | null = null;

    try {
      const n8nResult = await withWebhookLock("curriculum", async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("[Curriculum] n8n 4min timeout → aborting");
          controller.abort();
        }, 240_000);

        try {
          const n8nResponse = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!n8nResponse.ok) {
            console.log(`[Curriculum] n8n HTTP ${n8nResponse.status} → fallback`);
            return null;
          }

          const text = await n8nResponse.text();
          if (!text?.trim()) {
            console.log("[Curriculum] n8n empty response → fallback");
            return null;
          }

          return text;
        } catch (err: any) {
          clearTimeout(timeoutId);
          if (err.name === "AbortError") console.log("[Curriculum] n8n timeout → fallback");
          else console.log("[Curriculum] n8n error:", err.message, "→ fallback");
          return null;
        }
      });

      if (n8nResult) {
        console.log("=== [Curriculum] ✅ n8n success ===");
        htmlResult = n8nResult;
      }
    } catch (e: any) {
      console.log("[Curriculum] n8n lock error:", e.message, "→ fallback");
    }

    // ── n8n failed → Pinecone + LLM fallback ──
    if (!htmlResult) {
      console.log("=== [Curriculum] Activating fallback (Pinecone + LLM) ===");
      const context = await fetchPineconeContext(files, userId);
      htmlResult = await generateCurriculumWithLLM(files, Number(age), difficulty, context);
      console.log("=== [Curriculum] ✅ Fallback success ===");
    }

    return new NextResponse(htmlResult, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="Training_Course.html"`,
      },
    });

  } catch (error: any) {
    console.error("Curriculum API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
