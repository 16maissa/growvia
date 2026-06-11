import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AuditDashboard } from "@/components/audit/audit-dashboard";
import { FreeDashboard } from "@/components/dashboard/free-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      userProfile: true,
      automationPrefs: true,
      audits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { actionPlans: { orderBy: { week_number: "asc" } } },
      },
      agentTasks: {
        where: {
          scheduled_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        orderBy: { scheduled_at: "asc" },
      },
      generatedContents: {
        where: { status: "draft" },
        include: { agentTask: true },
      },
    },
  });

  if (!user) redirect("/sign-in");

  const plan = user.userProfile?.plan ?? "libre";
  const lastAudit = user.audits[0] ?? null;

  // ── FREE PLAN: show free dashboard ──────────────────────────
  if (plan === "libre") {
    return <FreeDashboard user={user as any} />;
  }

  // ── PAID PLAN but no audit yet: redirect to analytics ───────
  if (!lastAudit) {
    redirect("/analytics");
  }

  // ── SEMI-AUTO: show full audit dashboard ────────────────────
  let activeCourse = null;
  const course = await prisma.course.findFirst({
    where: { userId: session.userId },
    include: { interactions: true },
    orderBy: { createdAt: "desc" },
  });

  if (course) {
    const freq: Record<string, number> = {};
    for (const int of course.interactions) {
      const q = int.question.trim().toLowerCase();
      freq[q] = (freq[q] || 0) + 1;
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    activeCourse = {
      id: course.id,
      name: course.name,
      telegram_bot_active: course.telegram_bot_active,
      studentQuestionsCount: course.interactions.length,
      topQuestion: sorted[0]?.[0] ?? null,
    };
  }

  return (
    <AuditDashboard
      user={user}
      audit={lastAudit as any}
      todayTasks={user.agentTasks}
      pendingDrafts={user.generatedContents}
      activeCourse={activeCourse}
    />
  );
}
