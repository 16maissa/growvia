import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlanClient } from "./client";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  const actionPlans = await prisma.actionPlan.findMany({
    where: { audit: { userId: session.userId } },
    orderBy: [
      { week_number: 'asc' }
    ],
    include: {
      agentTasks: {
        include: {
          generatedContents: true
        }
      }
    }
  });

  return <PlanClient actionPlans={actionPlans} />;
}
