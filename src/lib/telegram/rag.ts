import { Pinecone } from "@pinecone-database/pinecone";

let pineconeInstance: Pinecone | null = null;

function getPinecone(): Pinecone {
  if (!pineconeInstance) {
    pineconeInstance = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return pineconeInstance;
}

async function embedText(text: string): Promise<number[] | null> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-large",
      input: text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[EMBED ERROR]", err);
    return null;
  }

  const data = await response.json();
  console.log("[EMBED DIMS]", data.data?.[0]?.embedding?.length);
  return data.data?.[0]?.embedding ?? null;
}

async function searchKnowledge(question: string): Promise<string> {
  try {
    const index = getPinecone().index("school-knowledge");
    const vector = await embedText(question);
    if (!vector) {
      console.error("[RAG] Embedding failed, skipping Pinecone");
      return "";
    }
    const results = await index.query({ vector, topK: 5, includeMetadata: true });
    if (!results.matches || results.matches.length === 0) return "";
    return results.matches
      .map((m) => m.metadata?.text || m.metadata?.content || "")
      .filter(Boolean)
      .join("\n\n");
  } catch (e) {
    console.error("[PINECONE ERROR]", e);
    return "";
  }
}

export async function generateAnswer(question: string): Promise<string> {
  const context = await searchKnowledge(question);

  const systemPrompt = `Tu es un assistant pédagogique pour des étudiants.
Réponds en te basant sur le contexte du cours fourni si disponible.
Sois clair, concis et pédagogique. Réponds dans la langue de la question.`;

  const userPrompt = context
    ? `Contexte du cours :\n${context}\n\nQuestion : ${question}`
    : `Question : ${question}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://growvia.app",
      "X-Title": "Growvia Bot",
    },
    body: JSON.stringify({
      model: "google/gemma-4-31b-it:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[LLM ERROR]", err);
    return "Je n'ai pas pu générer une réponse.";
  }

  const data = await response.json();
  console.log("[LLM RESPONSE]", JSON.stringify(data).substring(0, 200));
  
  return data.choices?.[0]?.message?.content || "Je n'ai pas pu générer une réponse.";
}
