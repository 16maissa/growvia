import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function checkAdmin() {
  const session = await getSession();
  return (session as any)?.isAdmin === true ? session : null;
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7 = new Date(today); last7.setDate(last7.getDate() - 7);
  const last30 = new Date(today); last30.setDate(last30.getDate() - 30);

  const [
    totalUsers, newUsersToday, newUsersLast7, newUsersLast30,
    totalDocs, totalChats, chatsToday, chatErrors,
    totalCourses, totalTelegramInteractions, totalVideos,
    planCounts, recentUsers, chatsByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: last7 } } }),
    prisma.user.count({ where: { createdAt: { gte: last30 } } }),
    prisma.uploadedDocument.count(),
    prisma.chatMessage.count(),
    prisma.chatMessage.count({ where: { createdAt: { gte: today } } }),
    prisma.chatMessage.count({
      where: {
        createdAt: { gte: today },
        OR: [
          { answer: { contains: "couldn't find" } },
          { answer: { contains: "NOT_FOUND" } },
          { answer: { contains: "search across all" } },
        ],
      },
    }),
    prisma.course.count(),
    prisma.telegramInteraction.count(),
    prisma.videoProject.count(),
    prisma.userProfile.groupBy({ by: ["plan"], _count: { plan: true } }),
    prisma.user.findMany({
      where: { isAdmin: false },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, createdAt: true,
        userProfile: { select: { plan: true } },
        _count: { select: { uploadedDocuments: true, courses: true } },
      },
    }),
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::text as count
      FROM "ChatMessage"
      WHERE "createdAt" >= ${last7}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ]);

  const plans: Record<string, number> = {};
  (planCounts as any[]).forEach(p => { plans[p.plan] = p._count.plan; });

  return NextResponse.json({
    users: { total: totalUsers, today: newUsersToday, last7: newUsersLast7, last30: newUsersLast30, plans },
    content: { documents: totalDocs, courses: totalCourses, videos: totalVideos },
    chat: {
      total: totalChats, today: chatsToday, errorsToday: chatErrors,
      successRate: chatsToday > 0 ? (((chatsToday - chatErrors) / chatsToday) * 100).toFixed(1) : "100",
    },
    telegram: { interactions: totalTelegramInteractions },
    recentUsers,
    chatsByDay,
  });
}
