import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AuditDashboard } from "@/components/audit/audit-dashboard";

export const dynamic = "force-dynamic";

export default async function AuditPage(props: { params: Promise<{ auditId: string }> }) {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");
  const { auditId } = await props.params;

  const audit = await prisma.audit.findUnique({
    where: { id: auditId, userId: session.userId },
    include: { actionPlans: { orderBy: { week_number: "asc" } } },
  });

  if (!audit) notFound();

  return <AuditDashboard audit={audit as any} />;
}
