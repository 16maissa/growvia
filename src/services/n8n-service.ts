export interface N8nAnalysisResponse {
  sentiment_global: string;
  frustrations: string[];
  besoins_clients: string[];
  opportunites_business: string[];
}

// ── LLM fallback via OpenRouter ───────────────────────────────────────────────
async function analyzeWithLLM(username: string): Promise<N8nAnalysisResponse> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY missing");

  const models = [
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-120b:free",
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
  ];

  const prompt = `You are a social media analyst. Analyze the Instagram account "@${username}" and return a JSON analysis.

Return ONLY a valid JSON object like this (no markdown, no explanation):
{
  "sentiment_global": "Brief overall sentiment about this account's niche and audience (2-3 sentences)",
  "frustrations": ["frustration 1", "frustration 2", "frustration 3"],
  "besoins_clients": ["need 1", "need 2", "need 3"],
  "opportunites_business": ["opportunity 1", "opportunity 2", "opportunity 3"]
}`;

  let lastError = "";
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
          "X-Title": "Growvia Analysis",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1000,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!res.ok) { lastError = `${model}: HTTP ${res.status}`; continue; }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content?.trim()) { lastError = `${model}: empty`; continue; }

      const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      console.log(`[Analysis Fallback] ✅ ${model}`);
      return {
        sentiment_global: parsed.sentiment_global || "Analysis unavailable",
        frustrations: Array.isArray(parsed.frustrations) ? parsed.frustrations : [],
        besoins_clients: Array.isArray(parsed.besoins_clients) ? parsed.besoins_clients : [],
        opportunites_business: Array.isArray(parsed.opportunites_business) ? parsed.opportunites_business : [],
      };
    } catch (e: any) {
      lastError = e.message;
      continue;
    }
  }
  throw new Error(`All fallback models failed. Last: ${lastError}`);
}

export class N8nService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl =
      process.env.N8N_ANALYSIS_WEBHOOK_URL ||
      "http://localhost:5678/webhook/instagram-analysis";
  }

  async analyzeInstagram(username: string): Promise<N8nAnalysisResponse> {
    console.log(`[Analysis] n8n attempt for @${username}`);

    // ── Try n8n first ──
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);

      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const text = await response.text();

      if (!text || text.trim().length === 0) {
        console.log("[Analysis] n8n empty response → fallback");
        return analyzeWithLLM(username);
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        const cleaned = text.replace(/```json|```/g, "").trim();
        try { data = JSON.parse(cleaned); }
        catch { console.log("[Analysis] n8n invalid JSON → fallback"); return analyzeWithLLM(username); }
      }

      if (Array.isArray(data)) data = data[0];
      if (data?.json) data = data.json;
      if (data?.output) {
        try { data = JSON.parse(data.output); } catch {}
      }

      if (!data || typeof data.sentiment_global !== "string") {
        console.log("[Analysis] n8n invalid shape → fallback");
        return analyzeWithLLM(username);
      }

      console.log("[Analysis] ✅ n8n success");
      return {
        sentiment_global: data.sentiment_global || "unknown",
        frustrations: data.frustrations || [],
        besoins_clients: data.besoins_clients || [],
        opportunites_business: data.opportunites_business || [],
      };

    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[Analysis] n8n timeout → fallback");
      } else {
        console.log("[Analysis] n8n error:", error.message, "→ fallback");
      }
      return analyzeWithLLM(username);
    }
  }
}

export const n8nService = new N8nService();
