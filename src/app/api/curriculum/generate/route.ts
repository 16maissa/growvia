import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
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

    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!n8nResponse.ok) {
      const text = await n8nResponse.text();
      console.error("n8n Curriculum Webhook Error:", text);
      return NextResponse.json({ success: false, error: `n8n failed with status ${n8nResponse.status}` }, { status: 502 });
    }

    // n8n returns binary HTML: stream it through to the client
    const contentType = n8nResponse.headers.get("content-type") || "text/html";
    const htmlBuffer = await n8nResponse.arrayBuffer();

    return new NextResponse(htmlBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="Training_Course.html"`,
      },
    });

  } catch (error: any) {
    console.error("Curriculum API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
