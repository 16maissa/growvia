import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json([]);
  
  const docs = await prisma.uploadedDocument.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, fileName: true }
  });
  return NextResponse.json(docs);
}
