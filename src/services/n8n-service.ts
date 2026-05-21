export interface N8nAnalysisResponse {
  sentiment_global: string;
  frustrations: string[];
  besoins_clients: string[];
  opportunites_business: string[];
}

export class N8nService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl =
      process.env.N8N_ANALYSIS_WEBHOOK_URL ||
      "http://localhost:5678/webhook/instagram-analysis";
  }

  async analyzeInstagram(username: string): Promise<N8nAnalysisResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s

    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        // IMPORTANT: match n8n expectation
        body: JSON.stringify({ username }),

        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // ❌ FIX IMPORTANT: handle empty response safely
      const text = await response.text();

      if (!text || text.trim().length === 0) {
        console.error("EMPTY RESPONSE FROM N8N");
        throw new Error(
          "Empty response body from n8n webhook (check Respond node in n8n)"
        );
      }

      // try parse JSON safely
      let data: any;

      try {
        data = JSON.parse(text);
      } catch (e) {
        const cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        try {
          data = JSON.parse(cleaned);
        } catch {
          console.error("RAW N8N RESPONSE:", text);
          throw new Error("Invalid JSON returned by n8n workflow");
        }
      }

      // handle array response
      if (Array.isArray(data)) {
        data = data[0];
      }

      // handle wrapper formats
      if (data?.json) data = data.json;
      if (data?.output) {
        try {
          data = JSON.parse(data.output);
        } catch {}
      }

      // final validation
      if (
        !data ||
        typeof data.sentiment_global !== "string"
      ) {
        console.error("INVALID SHAPE:", data);
        throw new Error("n8n response missing required fields");
      }

      return {
        sentiment_global: data.sentiment_global || "unknown",
        frustrations: data.frustrations || [],
        besoins_clients: data.besoins_clients || [],
        opportunites_business: data.opportunites_business || [],
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new Error("Timeout: n8n workflow took too long to respond.");
      }

      throw new Error(`Failed to process analysis: ${error.message}`);
    }
  }
}

export const n8nService = new N8nService();