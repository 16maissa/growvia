import { NextResponse } from "next/server";
import { n8nService } from "@/services/n8n-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Call n8n webhook
    const n8nResult = await n8nService.analyzeInstagram(username);

    // Save to database
    const analysis = await prisma.analysis.create({
      data: {
        instagramUsername: username,
        sentimentGlobal: n8nResult.sentiment_global,
        frustrations: n8nResult.frustrations,
        besoinsClients: n8nResult.besoins_clients,
        opportunitesBusiness: n8nResult.opportunites_business,
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
