import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    const userId = (session as any)?.userId || null;

    const documents = await prisma.uploadedDocument.findMany({
      where: { userId: userId },
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
