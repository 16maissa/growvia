import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/jwt";
import { cookies } from "next/headers";

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

async function generateAuditWithLLM(params: {
  instagram_handle: string;
  niche?: string;
  main_offer?: string;
  price_range?: string;
  target_audience?: string;
  main_goal?: string;
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
- Niche: ${params.niche || "general"}
- Main offer: ${params.main_offer || "unknown"}
- Price range: ${params.price_range || "unknown"}
- Target audience: ${params.target_audience || "general"}
- Main goal: ${params.main_goal || "grow instagram"}
Return ONLY valid JSON (no markdown):
{"audit_score":65,"plan_type":"optimisation","metrics":{"engagement_rate":"3.2%","posting_frequency":"3x/week","best_format":"Reels"},"audience":{"primary_age":"25-34","primary_gender":"Female","top_interests":["fitness","wellness"]},"profile":{"bio_quality":"Good","visual_consistency":"Needs improvement","cta_presence":"Missing"},"errors":["No clear CTA in bio","Inconsistent posting schedule"],"ai_report":{"tasks":[{"week":1,"day":"1","type":"reel","action":"Create engaging intro reel about your main offer","cta":"Follow for more tips","priority":"high"},{"week":1,"day":"3","type":"post","action":"Share a client testimonial","cta":"DM for details","priority":"high"},{"week":1,"day":"5","type":"story","action":"Behind the scenes","cta":"Swipe up","priority":"medium"},{"week":2,"day":"2","type":"reel","action":"Top 3 tips in your niche","cta":"Save this post","priority":"high"},{"week":2,"day":"4","type":"carousel","action":"Educational content about your offer","cta":"Share this","priority":"medium"}]}}`;
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
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 2000 }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!res.ok) continue;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content?.trim()) continue;
      const parsed = getValidParsedJson(content);
      if (parsed?.audit_score !== undefined) { console.log(`[Audit] LLM OK: ${model}`); return parsed; }
    } catch { continue; }
  }
  return null;
}

function toPrismaplan(plan: string | undefined): "libre" | "croissance" | "autopilote" {
  if (plan === "semi-auto" || plan === "croissance") return "croissance";
  if (plan === "autopilote") return "autopilote";
  return "libre";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = String(session.userId);
    const { plan, instagram_handle, niche, main_offer, price_range, target_audience, main_goal } = await req.json();

    if (!instagram_handle) return NextResponse.json({ error: "Instagram handle is required." }, { status: 400 });

    const existingProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const currentPlan = existingProfile?.plan ?? "libre";
    const prismaplan = plan ? toPrismaplan(plan) : currentPlan;

    await prisma.userProfile.update({
      where: { userId },
      data: { instagram_handle, niche: niche ?? null, main_offer: main_offer ?? null, price_range: price_range ?? null, target_audience: target_audience ?? null, main_goal: main_goal ?? null, plan: prismaplan, setup_done: true },
    });

    // Only update automationPrefs if plan explicitly provided
    if (plan) {
      const autoMode = prismaplan === "autopilote" ? "semi_auto" : "libre";
      await prisma.automationPrefs.update({ where: { userId }, data: { mode: autoMode } });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_AUDIT;
    let n8nData: any = null;

    if (webhookUrl) {
      try {
        const n8nRes = await fetchWithTimeout(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instagram_handle, niche, main_offer, price_range, target_audience, main_goal, user_id: userId }) }, N8N_TIMEOUT_MS);
        const rawText = await n8nRes.text();
        if (rawText?.trim()) {
          const parsed = getValidParsedJson(rawText);
          n8nData = Array.isArray(parsed) ? parsed[0] : parsed;
          if (n8nData?.audit_score === undefined) n8nData = null;
        }
      } catch (e: any) {
        console.log("[Audit] n8n error:", e.name === "AbortError" ? "timeout" : e.message);
      }
    }

    if (!n8nData) n8nData = await generateAuditWithLLM({ instagram_handle, niche, main_offer, price_range, target_audience, main_goal });

    if (!n8nData) {
      n8nData = { audit_score: 60, plan_type: "optimisation", metrics: { engagement_rate: "3.0%", posting_frequency: "2x/week", best_format: "Reels" }, audience: { primary_age: "25-34", primary_gender: "Mixed", top_interests: ["business"] }, profile: { bio_quality: "Average", visual_consistency: "Needs work", cta_presence: "Missing" }, errors: ["No clear CTA in bio", "Inconsistent posting schedule"], ai_report: { tasks: [{ week: 1, day: "1", type: "reel", action: "Create engaging content about your offer", cta: "Follow for more", priority: "high" }, { week: 1, day: "3", type: "post", action: "Share a testimonial", cta: "DM me", priority: "high" }, { week: 1, day: "5", type: "story", action: "Behind the scenes", cta: "Tap for more", priority: "medium" }] } };
    }

    // Build profile_json compatible with dashboard display
    const rawProfile = n8nData.profile ?? {};
    const profileJson = {
      username: instagram_handle,
      full_name: rawProfile.full_name ?? instagram_handle,
      biography: rawProfile.biography ?? rawProfile.bio_quality ?? null,
      followers: rawProfile.followers ?? null,
      following: rawProfile.following ?? null,
      posts_count: rawProfile.posts_count ?? null,
      is_verified: rawProfile.is_verified ?? false,
    };

    // Build metrics_json with numeric values
    const rawMetrics = n8nData.metrics ?? {};
    const parseNum = (v: any) => {
      if (v == null) return null;
      const n = parseFloat(String(v).replace("%","").replace("x/week","").trim());
      return isNaN(n) ? null : n;
    };
    const metricsJson = {
      engagement_rate: parseNum(rawMetrics.engagement_rate),
      reach_ratio: parseNum(rawMetrics.reach_ratio) ?? null,
      save_rate: parseNum(rawMetrics.save_rate) ?? null,
      posting_frequency: rawMetrics.posting_frequency ?? rawMetrics.best_format ?? null,
      reel_ratio: parseNum(rawMetrics.reel_ratio) ?? null,
      bio_clicks: parseNum(rawMetrics.bio_clicks) ?? null,
    };

    // Build errors_json as array of objects
    const rawErrors = n8nData.errors ?? [];
    const errorsJson = Array.isArray(rawErrors)
      ? rawErrors.map((e: any, i: number) => typeof e === "string"
          ? { title: e, impact_on_sales: "Impacts growth", recommendation: "Fix this issue", severity: i === 0 ? "HIGH" : "MEDIUM" }
          : e)
      : [];

    const audit = await prisma.audit.create({
      data: { userId, score: n8nData.audit_score ?? null, plan_type: n8nData.plan_type ?? null, errors_json: errorsJson, metrics_json: metricsJson, audience_json: n8nData.audience ?? {}, profile_json: profileJson, revenue_estimation_json: n8nData.revenue_estimation ?? {}, ai_report_json: n8nData.ai_report ?? {} },
    });

    const tasks: any[] = n8nData.ai_report?.tasks ?? [];
    if (tasks.length > 0) {
      await prisma.actionPlan.createMany({
        data: tasks.map((t) => ({ auditId: audit.id, week_number: Number(t.week || 1), day_of_week: String(t.day || "1"), content_type: t.type || "reel", topic: t.action || t.title || "content", cta: t.cta || null, optimal_hour: t.priority || "high", status: "pending" })),
      });
    }

    // Refresh JWT with updated plan
    const updatedProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const newToken = await encrypt({
      userId,
      email: updatedUser?.email,
      plan: updatedProfile?.plan ?? "libre",
      setup_done: updatedProfile?.setup_done ?? true,
    });
    const response = NextResponse.json({ success: true, auditId: audit.id });
    response.cookies.set("session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error: any) {
    console.error("[AUDIT ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
