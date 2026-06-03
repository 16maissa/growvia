import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AuditDashboard } from "@/components/audit/audit-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Activity } from "lucide-react";

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
        include: { actionPlans: { orderBy: { week_number: "asc" } } }
      },
      agentTasks: {
        where: {
          scheduled_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          }
        },
        orderBy: { scheduled_at: "asc" }
      },
      generatedContents: {
        where: { status: "draft" },
        include: { agentTask: true }
      }
    }
  });

  if (!user) redirect("/sign-in");

  const lastAudit = user.audits[0] || null;

  if (!lastAudit) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-primary-600/10 rounded-full flex items-center justify-center mb-6">
          <Activity className="w-10 h-10 text-primary-600" />
        </div>
        <h1 className="text-3xl font-black mb-4 text-[var(--text-primary)]">Welcome to Growvia</h1>
        <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-lg">
          To get started, launch an analysis of your account so our AI can generate your personalized action plan.
        </p>
        <Link href="/settings">
          <Button size="lg" className="text-base font-semibold px-8 py-6 rounded-full shadow-lg bg-[#0F6E56] hover:bg-[#085041] text-white">
            Launch my analysis now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <AuditDashboard 
      user={user} 
      audit={lastAudit as any} 
      todayTasks={user.agentTasks} 
      pendingDrafts={user.generatedContents} 
    />
  );
}
