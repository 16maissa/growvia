import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { task_id, action, updated_content } = await req.json();

    const task = await prisma.agentTask.findUnique({
      where: { id: task_id, userId: session.userId },
      include: { generatedContents: true }
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const content = task.generatedContents[0];

    if (action === "skip") {
      await prisma.agentTask.update({ where: { id: task_id }, data: { status: "skipped" } });
      if (content) {
        await prisma.generatedContent.update({ where: { id: content.id }, data: { status: "skipped" } });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "edit") {
      if (!updated_content) {
        return NextResponse.json({ success: true, content: content?.content_json });
      } else {
        if (content) {
          await prisma.generatedContent.update({
            where: { id: content.id },
            data: { content_json: updated_content }
          });
        }
        return NextResponse.json({ success: true });
      }
    }

    if (action === "approve") {
      await prisma.agentTask.update({
        where: { id: task_id },
        data: { status: "done", approved_at: new Date() }
      });
      if (content) {
        await prisma.generatedContent.update({
          where: { id: content.id },
          data: { status: "approved", approved_at: new Date() }
        });
      }

      // Trigger N8N to publish
      const webhookUrl = process.env.N8N_WEBHOOK_AGENT_PUBLISH;
      if (webhookUrl && content) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.userId,
            taskId: task_id,
            content: updated_content || content.content_json,
            type: content.type
          })
        }).catch(console.error); // Fire and forget
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
