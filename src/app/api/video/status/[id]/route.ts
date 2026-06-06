import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Project ID is required." },
        { status: 400 }
      );
    }

    const project = await prisma.videoProject.findUnique({
      where: { id },
      include: {
        scenes: {
          orderBy: { sceneNumber: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, project },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Video Status API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
