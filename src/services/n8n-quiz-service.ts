export type QuizQuestion = {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer?: string;
};

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
  const prompt = `Generate a unified custom quiz from the following selected sources: ${fileNamesString}. Detailed criteria: Total of ${totalQuestions} questions, containing exactly ${easyCount} Easy questions, ${mediumCount} Medium questions, and ${hardCount} Hard questions. Ensure each item contains exactly ${choicesCount} options.

VERY IMPORTANT - YOU MUST FORMAT YOUR OUTPUT EXACTLY AS A VALID JSON ARRAY. NO MARKDOWN, NO CODE FENCES, NO OTHER TEXT.
Return ONLY a raw JSON array like this:
[
  {
    "id": 1,
    "questionText": "What does AI stand for?",
    "options": ["Automated Intelligence", "Artificial Intelligence", "Advanced Integration", "Algorithmic Implementation"],
    "correctAnswer": "Artificial Intelligence"
  }
]
`;

  console.log("=== [DEBUG] Sending Quiz Request to n8n ===");

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatInput: prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n Quiz Webhook Error:", errorText);
      throw new Error(`n8n failed with status: ${response.status}`);
    }

    const rawText = await response.text();

    if (!rawText || rawText.trim() === "") {
      throw new Error("n8n returned an empty response.");
    }

    // Strip markdown code fences if the LLM added them anyway
    const cleaned = rawText.trim().replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Could not parse n8n response as JSON:", cleaned.slice(0, 200));
      throw new Error("n8n did not return valid JSON. Check the workflow output format.");
    }

    // n8n sometimes wraps in an object: { output: [...] } or { quiz: [...] }
    let questions: QuizQuestion[] = [];
    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (Array.isArray(parsed.output)) {
      questions = parsed.output;
    } else if (Array.isArray(parsed.quiz)) {
      questions = parsed.quiz;
    } else if (Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else {
      throw new Error("Unexpected JSON structure from n8n. Expected an array of questions.");
    }

    return questions;

  } catch (error: any) {
    console.error("Quiz Service Error:", error);
    throw new Error(error.message || "Failed to communicate with n8n quiz agent.");
  }
}
