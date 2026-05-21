export interface N8nImageResponse {
  image: string; // base64 string
}

export class N8nImageService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.N8N_IMAGE_WEBHOOK_URL || "http://localhost:5678/webhook/generate-image";
  }

  async generateImage(prompt: string): Promise<N8nImageResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`n8n webhook failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.image) {
         throw new Error("Invalid response format from n8n: missing image base64");
      }

      return data as N8nImageResponse;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Timeout: Image generation took too long to respond.");
      }
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }
}

export const n8nImageService = new N8nImageService();
