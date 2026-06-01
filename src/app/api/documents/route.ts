import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const documents = await prisma.uploadedDocument.findMany({
      distinct: ["fileName"],
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
