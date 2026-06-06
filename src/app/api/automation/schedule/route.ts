import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = String(session.userId);

    console.log("[ORCHESTRATOR] userId:", userId);

    const prefs = await prisma.automationPrefs.findUnique({
      where: { userId },
    });

    if (!prefs) {
      return NextResponse.json(
        { error: "Prefs not found" },
        { status: 404 }
      );
    }

    // Fetch all pending ActionPlans
    const plans = await prisma.actionPlan.findMany({
      where: {
        audit: { userId },
        status: "pending",
      },
    });

    console.log("[ORCHESTRATOR] pending plans:", plans.length);

    const tasksCreated: any[] = [];

    for (const plan of plans) {
      const type = plan.content_type?.toLowerCase();

      if (!type) {
        console.log("[ORCHESTRATOR] skip plan without content_type:", plan.id);
        continue;
      }

      const task = await prisma.agentTask.create({
        data: {
          userId,
          actionPlanId: plan.id,
          task_type: type,
          status: "pending",
          scheduled_at: new Date(),
        },
      });

      tasksCreated.push(task);

      if (prefs.auto_publish) {
        await prisma.agentTask.create({
          data: {
            userId,
            actionPlanId: plan.id,
            task_type: "publish",
            status: "planned",
            scheduled_at: new Date(),
            params_json: {
              dependencyTaskId: task.id,
            },
          },
        });
      }

      await prisma.actionPlan.update({
        where: { id: plan.id },
        data: { status: "scheduled" },
      });
    }

    return NextResponse.json({
      success: true,
      count: tasksCreated.length,
    });
  } catch (e: any) {
    console.error("[ORCHESTRATOR ERROR]", e);

    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}