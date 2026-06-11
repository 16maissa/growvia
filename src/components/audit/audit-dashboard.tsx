"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Users, Eye, Bookmark, Activity, Video, ExternalLink, Target, 
  Star, Zap, ArrowRight, BarChart2, FileText, Globe, Clock, LogOut, Loader2,
  Copy, CheckCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuditError {
  title: string;
  impact_on_sales: string;
  recommendation: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}
interface Metrics {
  engagement_rate?: number;
  reach_ratio?: number;
  save_rate?: number;
  posting_frequency?: string;
  reel_ratio?: number;
  bio_clicks?: number;
  avg_likes?: number;
  avg_comments?: number;
  avg_views?: number;
}
interface Audience {
  top_country?: string;
  top_age_group?: string;
  gender_split?: string;
  active_hours?: string;
}
interface ActionPlanItem {
  id: string;
  week_number: number;
  day_of_week: string;
  content_type: string;
  topic: string;
  cta: string | null;
  optimal_hour: string | null;
  status: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  CRITICAL: { color: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: XCircle },
  HIGH:     { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: AlertTriangle },
  MEDIUM:   { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: AlertTriangle },
  LOW:      { color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: CheckCircle2 },
};

const PLAN_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  refonte:      { label: "Complete Overhaul", color: "text-red-500",     icon: XCircle },
  optimisation: { label: "Optimization",      color: "text-yellow-500",  icon: Zap },
  acceleration: { label: "Acceleration",      color: "text-emerald-500", icon: TrendingUp },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 54, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" className="text-[var(--border-color)]" strokeWidth="3" />
        <circle cx="72" cy="72" r={r} fill="none" stroke="#0F6E56" strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div className="text-center">
        <div className="text-4xl font-medium text-[#0F6E56]">{score}</div>
        <div className="text-xs text-[var(--text-muted)]">/ 100</div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, highlight }: any) {
  return (
    <div className="relative bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4 flex items-center gap-4 hover:border-[#0F6E56]/30 transition-colors">
      {highlight !== undefined && (
        <span className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${highlight ? "bg-[#1D9E75]" : "bg-[#E24B4A]"}`} />
      )}
      <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-600/10 shrink-0">
        <Icon className="w-5 h-5 text-[#0F6E56]" />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-[var(--text-muted)] truncate">{label}</p>
        <p className="text-[24px] font-medium text-[var(--text-primary)] leading-tight my-0.5 truncate">{value ?? "—"}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] truncate">{sub}</p>}
      </div>
    </div>
  );
}

function ErrorCard({ error }: { error: AuditError }) {
  const [open, setOpen] = useState(false);
  const cfg = SEVERITY_CONFIG[error.severity] ?? SEVERITY_CONFIG.LOW;
  const Icon = cfg.icon;
  return (
    <motion.div layout className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden cursor-pointer`} onClick={() => setOpen(v => !v)}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${cfg.color} shrink-0`} />
          <span className="font-semibold">{error.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${cfg.bg} ${cfg.color} border ${cfg.border}`}>{error.severity}</Badge>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4 space-y-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Sales Impact</p>
              <p className="text-sm">{error.impact_on_sales}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">AI Recommendation</p>
              <p className="text-sm">{error.recommendation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs h-7 gap-1.5">
      {copied ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
// Redirects to the relevant agent page when Generate is clicked
const CONTENT_TYPE_ROUTES: Record<string, string> = {
  reel:      "/studio/video",
  video:     "/studio/video",
  story:     "/studio/video",
  image:     "/studio/image",
  carousel:  "/studio/image",
  post:      "/studio/image",
  quiz:      "/quiz",
  qa:        "/quiz",
  curriculum:"/curriculum",
  cours:     "/curriculum",
  formation: "/curriculum",
};

function TaskCard({ action, currentMode }: any) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(action.status || "pending");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const typeColors: Record<string, string> = {
    reel:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
    video:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    carousel: "bg-blue-500/10   text-blue-400   border-blue-500/20",
    post:     "bg-blue-500/10   text-blue-400   border-blue-500/20",
    quiz:     "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    story:    "bg-pink-500/10   text-pink-400   border-pink-500/20",
  };
  const typeClass = typeColors[action.content_type?.toLowerCase()] ?? "bg-primary/10 text-primary border-primary/20";

  const STATUS_COLORS: Record<string, string> = {
    pending:  "text-muted-foreground bg-muted",
    draft:    "text-amber-500 bg-amber-500/10",
    approved: "text-emerald-500 bg-emerald-500/10",
    done:     "text-emerald-600 bg-emerald-500/10",
    skipped:  "text-rose-500 bg-rose-500/10",
  };
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const isDone = status === "done" || status === "approved";
  const isRunning = generating;

  // In semi_auto: redirect to the right agent page
  const handleGenerate = () => {
    const route = CONTENT_TYPE_ROUTES[action.content_type?.toLowerCase()] || "/dashboard";
    router.push(route);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 transition-all bg-card ${isDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={`text-xs border ${typeClass}`}>{action.content_type?.toUpperCase()}</Badge>
            <span className="text-xs text-muted-foreground capitalize">{action.day_of_week} · {action.optimal_hour ?? ""}</span>
            <Badge variant="outline" className={`text-[10px] ml-2 ${statusColor}`}>
              {isDone ? "✓ Done" : status}
            </Badge>
          </div>
          <p className="font-medium text-sm">{action.topic}</p>
          {action.cta && <p className="text-xs text-muted-foreground mt-1">CTA: <span className="italic">{action.cta}</span></p>}
        </div>

        {/* Generate button — only in semi_auto mode, only for pending tasks */}
        {currentMode === "semi_auto" && !isDone && (
          <Button size="sm" onClick={handleGenerate} disabled={isRunning}
            className="text-xs h-8 gap-1.5 min-w-[110px] shrink-0">
            {isRunning ? <><Loader2 className="w-3 h-3 animate-spin" /> Loading…</> : <>⚡ Generate</>}
          </Button>
        )}
      </div>
      {genError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{genError}
        </div>
      )}
    </motion.div>
  );
}

function MonthSection({ monthNum, plans, currentMode }: any) {
  const [collapsed, setCollapsed] = useState(monthNum > 1);
  const monthPlans = plans.filter((p: ActionPlanItem) =>
    monthNum === 1 ? p.week_number <= 4 :
    monthNum === 2 ? p.week_number >= 5 && p.week_number <= 8 :
    p.week_number >= 9
  );
  const weeks = Array.from(new Set(monthPlans.map((p: ActionPlanItem) => p.week_number))).sort() as number[];
  const done = monthPlans.filter((p: ActionPlanItem) => p.status === "approved" || p.status === "done").length;
  if (monthPlans.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      <button className="w-full flex items-center justify-between p-6 text-left hover:bg-card/60 transition-colors" onClick={() => setCollapsed(v => !v)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary">M{monthNum}</div>
          <div>
            <p className="font-bold">Month {monthNum}</p>
            <p className="text-sm text-muted-foreground">{monthPlans.length} tasks · {done} done</p>
          </div>
        </div>
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 space-y-6">
            {weeks.map(w => (
              <div key={w}>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" /> Week {w} <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-3">
                  {monthPlans.filter((p: ActionPlanItem) => p.week_number === w).map((action: ActionPlanItem) => (
                    <TaskCard key={action.id} action={action} currentMode={currentMode} />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AuditDashboard({ user, audit }: any) {
  const router = useRouter();
  // Only 2 tabs: overview + errors
  const [activeTab, setActiveTab] = useState<"overview" | "errors" | "plan">("overview");
  const [loggingOut, setLoggingOut] = useState(false);
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  const currentMode = user?.automationPrefs?.mode || "libre";
  const profile: any = audit.profile_json ?? {};
  const metrics: Metrics = (audit.metrics_json as Metrics) ?? {};
  const errors: AuditError[] = Array.isArray(audit.errors_json) ? audit.errors_json : [];
  const aiReport: any = audit.ai_report_json ?? {};

  // Build plans from actionPlans or fallback to ai_report_json
  let plans = audit.actionPlans || [];
  if (plans.length === 0 && aiReport) {
    const fallbackActions: any[] = [];
    for (let m = 1; m <= 3; m++) {
      const mois = aiReport?.[`mois_${m}`] || aiReport?.[`mois${m}`] || aiReport?.[`month_${m}`];
      if (!mois) continue;
      const semaines = Array.isArray(mois) ? mois : (mois.semaines || mois.weeks || []);
      for (const semaine of semaines) {
        const actions = semaine.actions || semaine.tasks || [];
        for (const action of actions) {
          fallbackActions.push({
            id: `fallback-${m}-${semaine.semaine || semaine.week || "1"}-${action.jour || "1"}`,
            week_number: Number(semaine.semaine || semaine.week || (m * 4 - 3)),
            day_of_week: action.jour || action.day_of_week || "Monday",
            content_type: action.type || action.content_type || "reel",
            topic: action.sujet || action.topic || action.action || "",
            cta: action.cta || "",
            optimal_hour: action.heure || action.optimal_hour || "19h",
            status: "pending",
          });
        }
      }
    }
    plans = fallbackActions;
  }

  const planCfg = PLAN_TYPE_CONFIG[audit.plan_type ?? ""] ?? { label: audit.plan_type ?? "—", color: "text-primary", icon: Star };
  const PlanIcon = planCfg.icon;

  const engagementData = useMemo(() => [
    { name: "Before",    value: Math.max((metrics.engagement_rate ?? 2) - 1.5, 0.5) },
    { name: "Current",   value: metrics.engagement_rate ?? 2 },
    { name: "+30 days",  value: (metrics.engagement_rate ?? 2) + 0.8 },
    { name: "+60 days",  value: (metrics.engagement_rate ?? 2) + 2 },
    { name: "+90 days",  value: (metrics.engagement_rate ?? 2) + 3.5 },
  ], [metrics.engagement_rate]);

  // Switch between libre and semi_auto only
  const handleModeChange = async (newMode: string) => {
    setIsChangingMode(true);
    setModeError(null);
    try {
      const res = await fetch("/api/automation/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      router.refresh();
    } catch (e: any) {
      setModeError(e.message);
    } finally {
      setIsChangingMode(false);
    }
  };

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
  }

  const tabs = [
    { id: "overview", label: "Overview",              icon: BarChart2 },
    { id: "errors",   label: `Errors (${errors.length})`, icon: AlertTriangle },
    { id: "plan",     label: `Plan (${plans.length})`,    icon: Target },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl italic tracking-tight" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>Audit Report</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-muted-foreground">@{profile.username ?? "—"}</p>
            {profile.is_verified && <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">✓ Verified</Badge>}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(audit.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {errors.filter(e => e.severity === "CRITICAL").length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              {errors.filter(e => e.severity === "CRITICAL").length} critical
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut} className="gap-2">
            <LogOut className="w-4 h-4" />{loggingOut ? "..." : "Logout"}
          </Button>
        </div>
      </div>

      {modeError && (
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />{modeError}
        </div>
      )}

      {/* ── Mode Selector — 2 modes only ── */}
      <Card className="bg-card/40 border-primary/10">
        <CardHeader>
          <CardTitle>Operating Mode</CardTitle>
          <CardDescription>
            {currentMode === "libre"
              ? "Libre mode — you generate content manually whenever you want."
              : "Semi-auto mode — your 90-day plan is ready. Click Generate on each task to create content."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          {/* Libre */}
          <button
            onClick={() => handleModeChange("libre")}
            disabled={isChangingMode || currentMode === "libre"}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all
              ${currentMode === "libre"
                ? "bg-[#0F6E56] text-white border-[#0F6E56]"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Zap className="w-4 h-4" /> Libre
          </button>

          {/* Semi-Auto */}
          <button
            onClick={() => handleModeChange("semi_auto")}
            disabled={isChangingMode || currentMode === "semi_auto"}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all
              ${currentMode === "semi_auto"
                ? "bg-[#0F6E56] text-white border-[#0F6E56]"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Activity className="w-4 h-4" /> Semi-Auto
            {currentMode === "semi_auto" && (
              <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Active</span>
            )}
          </button>
        </CardContent>
      </Card>

      {/* ── Score + Profile ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center justify-center py-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <div className="text-center space-y-4">
            <ScoreRing score={audit.score ?? 0} />
            <div>
              <p className="text-sm text-muted-foreground">Global Score</p>
              <div className={`flex items-center justify-center gap-1.5 mt-1 font-bold ${planCfg.color}`}>
                <PlanIcon className="w-4 h-4" />{planCfg.label}
              </div>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 bg-card/40">
          <CardHeader><CardTitle className="text-base">Instagram Profile</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-background/60 rounded-lg">
              <p className="text-2xl font-black">{profile.followers?.toLocaleString("en-US") ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-lg">
              <p className="text-2xl font-black">{profile.following?.toLocaleString("en-US") ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-lg">
              <p className="text-2xl font-black">{profile.posts_count ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-lg">
              <p className={`text-2xl font-black ${metrics.engagement_rate && metrics.engagement_rate > 3 ? "text-emerald-500" : "text-yellow-500"}`}>
                {metrics.engagement_rate != null ? `${metrics.engagement_rate}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
            {profile.full_name && (
              <div className="col-span-full sm:col-span-2 p-3 bg-background/60 rounded-lg">
                <p className="text-xs font-bold text-foreground mb-1">{profile.full_name}</p>
                {profile.biography && <p className="text-xs text-muted-foreground line-clamp-2">{profile.biography}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs: Overview | Errors | Plan ── */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center
                ${activeTab === tab.id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Key Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard icon={Activity}    label="Engagement Rate"  value={metrics.engagement_rate != null ? `${metrics.engagement_rate}%` : null} sub="Target: > 3%" highlight={metrics.engagement_rate != null && metrics.engagement_rate > 3} />
                <MetricCard icon={Eye}         label="Reach Ratio"      value={metrics.reach_ratio != null ? `${metrics.reach_ratio}%` : null} />
                <MetricCard icon={Bookmark}    label="Save Rate"        value={metrics.save_rate != null ? `${metrics.save_rate}%` : null} />
                <MetricCard icon={TrendingUp}  label="Post Frequency"   value={metrics.posting_frequency} />
                <MetricCard icon={Video}       label="Reel Share"       value={metrics.reel_ratio != null ? `${(metrics.reel_ratio * 100).toFixed(0)}%` : null} />
                <MetricCard icon={ExternalLink} label="Bio Clicks (30D)" value={metrics.bio_clicks} />
              </div>
              <h2 className="text-xl font-bold mt-8">Engagement Projection</h2>
              <Card>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis unit="%" tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => `${v}%`} />
                      <ReferenceLine y={3} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Target 3%", fill: "#10b981", fontSize: 11 }} />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ── ERRORS ── */}
        {activeTab === "errors" && (
          <motion.div key="errors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold">Detected Errors</h2>
                <div className="flex gap-2 flex-wrap">
                  {(["CRITICAL","HIGH","MEDIUM","LOW"] as const).map(s => {
                    const n = errors.filter(e => e.severity === s).length;
                    if (!n) return null;
                    const cfg = SEVERITY_CONFIG[s];
                    return <span key={s} className={`px-2 py-1 text-xs rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{s}: {n}</span>;
                  })}
                </div>
              </div>
              {errors.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                  <p>No critical errors detected 🎉</p>
                </div>
              ) : (
                errors
                  .sort((a, b) => ({ CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 }[a.severity] ?? 4) - ({ CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 }[b.severity] ?? 4))
                  .map((err, i) => <ErrorCard key={i} error={err} />)
              )}
            </div>
          </motion.div>
        )}

        {/* ── PLAN ── */}
        {activeTab === "plan" && (
          <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-xl font-bold">90-Day Action Plan</h2>
                {currentMode === "libre" && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
                    <Zap className="w-4 h-4" />
                    Switch to Semi-Auto to generate content from the plan
                  </div>
                )}
              </div>
              {plans.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No action plan generated yet.</p>
                </div>
              ) : (
                <>
                  <MonthSection monthNum={1} plans={plans} currentMode={currentMode} />
                  <MonthSection monthNum={2} plans={plans} currentMode={currentMode} />
                  <MonthSection monthNum={3} plans={plans} currentMode={currentMode} />
                </>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
