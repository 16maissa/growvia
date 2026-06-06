import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// n8n can be slow due to Apify scraping — 5 minute timeout
const N8N_TIMEOUT_MS = 5 * 60 * 1000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function getValidParsedJson(rawText: string): any {
  let text = rawText.replace(/```json|```/g, "").trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {}

  for (let len = text.length; len > 0; len--) {
    const subText = text.substring(0, len).trim();
    let inString = false;
    let isEscaped = false;
    const stack: string[] = [];

    for (let i = 0; i < subText.length; i++) {
      const char = subText[i];

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === "\\") {
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{" || char === "[") stack.push(char);
        else if (char === "}") stack.pop();
        else if (char === "]") stack.pop();
      }
    }

    let repaired = subText;

    if (inString) repaired += '"';

    for (let j = stack.length - 1; j >= 0; j--) {
      if (stack[j] === "{") repaired += "}";
      else if (stack[j] === "[") repaired += "]";
    }

    try {
      return JSON.parse(repaired);
    } catch (err) {
      // keep looping
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    console.log("[AUDIT] session:", session);

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ ONLY FIX (NO LOGIC CHANGE)
    const userId = String(session.userId);

    const {
      plan,
      instagram_handle,
      niche,
      main_offer,
      price_range,
      target_audience,
      main_goal,
    } = await req.json();

    if (!instagram_handle) {
      return NextResponse.json(
        { error: "Le pseudo Instagram est requis." },
        { status: 400 }
      );
    }

    // 1. SAVE PROFILE
    await prisma.userProfile.update({
      where: { userId: userId },
      data: {
        instagram_handle,
        niche,
        main_offer,
        price_range,
        target_audience,
        main_goal,
        plan: plan || "croissance",
        setup_done: true,
      },
    });

    // 2. UPDATE PREFS
    if (plan === "autopilote") {
      await prisma.automationPrefs.update({
        where: { userId: userId },
        data: { mode: "semi_auto" },
      });
    } else if (plan === "croissance") {
      await prisma.automationPrefs.update({
        where: { userId: userId },
        data: { mode: "libre" },
      });
    }

    // 3. N8N CALL
    const webhookUrl = process.env.N8N_WEBHOOK_AUDIT;
    let n8nData: any = null;

    if (webhookUrl) {
      const n8nRes = await fetchWithTimeout(
        webhookUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instagram_handle,
            niche,
            main_offer,
            price_range,
            target_audience,
            main_goal,
            user_id: userId, // ✅ FIX ONLY
          }),
        },
        N8N_TIMEOUT_MS
      );

      const rawText = await n8nRes.text();

      try {
        n8nData = JSON.parse(rawText);
        if (Array.isArray(n8nData)) n8nData = n8nData[0];
      } catch {
        n8nData = null;
      }
    } else {
      console.warn("N8N mock mode");

      n8nData = {
        audit_score: 67,
        plan_type: "optimisation",
        metrics: {},
        audience: {},
        profile: {},
        errors: [],
        ai_report: {
          tasks: [
            {
              week: 1,
              day: "1",
              type: "reel",
              action: "Test content",
              cta: "Follow",
              priority: "high",
            },
          ],
        },
      };
    }

    // 4. AUDIT CREATE (UNCHANGED STRUCTURE)
    const audit = await prisma.audit.create({
      data: {
        userId: userId,
        score: n8nData.audit_score ?? null,
        plan_type: n8nData.plan_type ?? null,
        errors_json: n8nData.errors ?? [],
        metrics_json: n8nData.metrics ?? {},
        audience_json: n8nData.audience ?? {},
        profile_json: n8nData.profile ?? {},
        revenue_estimation_json: n8nData.revenue_estimation ?? {},
        ai_report_json: n8nData.ai_report ?? {},
      },
    });

    // 5. ACTIONS PARSING (UNCHANGED LOGIC)
    let allActions: any[] = [];

    const aiReport = n8nData.ai_report;

    if (Array.isArray(aiReport?.tasks)) {
      for (const t of aiReport.tasks) {
        allActions.push({
          week_number: Number(t.week || 1),
          day_of_week: t.day || "1",
          content_type: t.type || "reel",
          topic: t.action || t.title || "content",
          cta: t.cta || "",
          optimal_hour: t.priority || "high",
        });
      }
    }

    if (allActions.length > 0) {
      await prisma.actionPlan.createMany({
        data: allActions.map((a) => ({
          auditId: audit.id,
          week_number: a.week_number,
          day_of_week: a.day_of_week,
          content_type: a.content_type,
          topic: a.topic,
          cta: a.cta || null,
          optimal_hour: a.optimal_hour,
          status: "pending",
        })),
      });
    }

    return NextResponse.json({
      success: true,
      auditId: audit.id,
    });
  } catch (error: any) {
    console.error("[AUDIT ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}