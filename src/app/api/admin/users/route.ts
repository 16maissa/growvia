import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function checkAdmin() {
  const session = await getSession();
  return (session as any)?.isAdmin === true ? session : null;
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const limit = 20;
  const where: any = { isAdmin: false };
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, createdAt: true,
        userProfile: { select: { plan: true } },
        _count: { select: { uploadedDocuments: true, courses: true, chatMessages: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId, plan } = await req.json();
  if (!userId || !plan) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await prisma.userProfile.upsert({
    where: { userId },
    update: { plan },
    create: { userId, plan },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
