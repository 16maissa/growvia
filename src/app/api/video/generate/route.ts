import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, chatInput } = body;

    if (!chatInput || typeof chatInput !== "string" || !chatInput.trim()) {
      return NextResponse.json(
        { success: false, error: "chatInput is required." },
        { status: 400 }
      );
    }

    // Create a new VideoProject record in PENDING status
    const project = await prisma.videoProject.create({
      data: {
        chatInput,
        status: "PENDING",
        ...(userId ? { userId } : {}),
      },
    });

    const webhookUrl = process.env.N8N_VIDEO_PIPELINE_WEBHOOK_URL || "http://localhost:5678/webhook/video-pipeline";

    console.log(`=== [Video Pipeline] Dispatching to n8n for project ${project.id}. chatInput: "${chatInput.slice(0, 50)}…"`);

    // Dispatch to n8n asynchronously
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        chatInput,
      }),
    }).catch((err) => {
      console.error(`=== [Video Pipeline] Failed to trigger n8n webhook for project ${project.id}:`, err);
      prisma.videoProject.update({
        where: { id: project.id },
        data: { status: "FAILED", error: "Failed to trigger n8n pipeline: " + err.message },
      }).catch(console.error);
    });

    // Return the projectId and status 202 immediately
    return NextResponse.json(
      { success: true, projectId: project.id, status: project.status },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("Video Generate API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
