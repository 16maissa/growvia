import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
  try { return JSON.parse(text); } catch {}
  for (let len = text.length; len > 0; len--) {
    const subText = text.substring(0, len).trim();
    let inString = false, isEscaped = false;
    const stack: string[] = [];
    for (let i = 0; i < subText.length; i++) {
      const char = subText[i];
      if (isEscaped) { isEscaped = false; continue; }
      if (char === "\\") { isEscaped = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (!inString) {
        if (char === "{" || char === "[") stack.push(char);
        else if (char === "}" || char === "]") stack.pop();
      }
    }
    let repaired = subText;
    if (inString) repaired += '"';
    for (let j = stack.length - 1; j >= 0; j--) {
      repaired += stack[j] === "{" ? "}" : "]";
    }
    try { return JSON.parse(repaired); } catch {}
  }
  return null;
}

// ── LLM fallback for audit ────────────────────────────────────────────────────
async function generateAuditWithLLM(params: {
  instagram_handle: string;
  niche: string;
  main_offer: string;
  price_range: string;
  target_audience: string;
  main_goal: string;
}): Promise<any> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const models = [
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-120b:free",
    "moonshotai/kimi-k2.6:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
  ];

  const prompt = `You are a social media growth expert. Generate a complete Instagram audit and action plan.

Profile:
- Instagram: @${params.instagram_handle}
- Niche: ${params.niche}
- Main offer: ${params.main_offer}
- Price range: ${params.price_range}
- Target audience: ${params.target_audience}
- Main goal: ${params.main_goal}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "audit_score": 65,
  "plan_type": "optimisation",
  "metrics": { "engagement_rate": "3.2%", "posting_frequency": "3x/week", "best_format": "Reels" },
  "audience": { "primary_age": "25-34", "primary_gender": "Female", "top_interests": ["fitness", "wellness"] },
  "profile": { "bio_quality": "Good", "visual_consistency": "Needs improvement", "cta_presence": "Missing" },
  "errors": ["No clear CTA in bio", "Inconsistent posting schedule"],
  "ai_report": {
    "tasks": [
      { "week": 1, "day": "1", "type": "reel", "action": "Create engaging intro reel about your main offer", "cta": "Follow for more tips", "priority": "high" },
      { "week": 1, "day": "3", "type": "post", "action": "Share a client transformation or testimonial", "cta": "DM for details", "priority": "high" },
      { "week": 1, "day": "5", "type": "story", "action": "Behind the scenes of your process", "cta": "Swipe up", "priority": "medium" },
      { "week": 2, "day": "2", "type": "reel", "action": "Top 3 tips related to your niche", "cta": "Save this post", "priority": "high" },
      { "week": 2, "day": "4", "type": "carousel", "action": "Educational content about your offer", "cta": "Share with someone who needs this", "priority": "medium" }
    ]
  }
}`;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 60_000);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": "https://growvia.network",
          "X-Title": "Growvia Audit",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!res.ok) continue;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content?.trim()) continue;
      const parsed = getValidParsedJson(content);
      if (parsed?.audit_score !== undefined) {
        console.log(`[Audit Fallback] ✅ ${model}`);
        return parsed;
      }
    } catch { continue; }
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

    const userId = String(session.userId);
    const { plan, instagram_handle, niche, main_offer, price_range, target_audience, main_goal } = await req.json();

    if (!instagram_handle) {
      return NextResponse.json({ error: "Le pseudo Instagram est requis." }, { status: 400 });
    }

    // 1. SAVE PROFILE
    await prisma.userProfile.update({
      where: { userId },
      data: { instagram_handle, niche, main_offer, price_range, target_audience, main_goal, plan: plan || "croissance", setup_done: true },
    });

    // 2. UPDATE PREFS
    if (plan === "autopilote") {
      await prisma.automationPrefs.update({ where: { userId }, data: { mode: "semi_auto" } });
    } else if (plan === "croissance") {
      await prisma.automationPrefs.update({ where: { userId }, data: { mode: "libre" } });
    }

    // 3. N8N CALL with fallback
    const webhookUrl = process.env.N8N_WEBHOOK_AUDIT;
    let n8nData: any = null;

    if (webhookUrl) {
      console.log("[Audit] Trying n8n...");
      try {
        const n8nRes = await fetchWithTimeout(
          webhookUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instagram_handle, niche, main_offer, price_range, target_audience, main_goal, user_id: userId }),
          },
          N8N_TIMEOUT_MS
        );

        const rawText = await n8nRes.text();
        if (rawText?.trim()) {
          const parsed = getValidParsedJson(rawText);
          if (Array.isArray(parsed)) n8nData = parsed[0];
          else n8nData = parsed;
          if (n8nData?.audit_score !== undefined) {
            console.log("[Audit] ✅ n8n success");
          } else {
            console.log("[Audit] n8n invalid shape → fallback");
            n8nData = null;
          }
        } else {
          console.log("[Audit] n8n empty → fallback");
        }
      } catch (e: any) {
        console.log("[Audit] n8n error:", e.name === "AbortError" ? "timeout" : e.message, "→ fallback");
        n8nData = null;
      }
    }

    // ── Fallback: LLM generates audit ──
    if (!n8nData) {
      console.log("[Audit] Activating LLM fallback...");
      n8nData = await generateAuditWithLLM({ instagram_handle, niche, main_offer, price_range, target_audience, main_goal });
    }

    // ── Last resort mock ──
    if (!n8nData) {
      console.log("[Audit] Using mock data");
      n8nData = {
        audit_score: 60,
        plan_type: "optimisation",
        metrics: {},
        audience: {},
        profile: {},
        errors: [],
        ai_report: {
          tasks: [
            { week: 1, day: "1", type: "reel", action: "Create engaging content about your offer", cta: "Follow for more", priority: "high" },
          ],
        },
      };
    }

    // 4. AUDIT CREATE
    const audit = await prisma.audit.create({
      data: {
        userId,
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

    // 5. ACTIONS PARSING
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

    return NextResponse.json({ success: true, auditId: audit.id });

  } catch (error: any) {
    console.error("[AUDIT ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
