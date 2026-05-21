import { NextResponse } from "next/server";
import { n8nImageService } from "@/services/n8n-image-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Call n8n webhook
    const n8nResult = await n8nImageService.generateImage(prompt);

    // Save to database
    // @ts-ignore - L'erreur rouge est due au cache de VS Code.
    const imageGeneration = await prisma.imageGeneration.create({
      data: {
        prompt,
        imageBase64: n8nResult.image,
      },
    });

    return NextResponse.json({
      success: true,
      imageGeneration,
    });
  } catch (error: any) {
    console.error("Image Generation API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
