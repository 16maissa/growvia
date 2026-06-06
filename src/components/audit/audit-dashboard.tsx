"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine,
} from "recharts";
import {
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Users, Eye, Bookmark, Activity, Video, ExternalLink, Target, DollarSign,
  Star, Zap, ArrowRight, BarChart2, FileText, Globe, Clock, LogOut, Loader2,
  Copy, CheckCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
interface RevenueEstimation {
  monthly_leads?: number;
  monthly_sales?: number;
  monthly_revenue_eur?: number;
  conversion_rate?: number;
  revenue_per_post?: number;
  cpa?: number;
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
interface PlanDisplay {
  type: "structured_plan" | "raw_text_plan";
  content: any;
}
interface Audit {
  id: string;
  score: number | null;
  plan_type: string | null;
  errors_json: AuditError[] | any;
  metrics_json: Metrics | any;
  audience_json: Audience | any;
  profile_json: any;
  revenue_estimation_json: RevenueEstimation | any;
  ai_report_json: any;
  actionPlans: ActionPlanItem[];
  createdAt: string;
}

// ─── Config ────────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  CRITICAL: { color: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: XCircle },
  HIGH:     { color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: AlertTriangle },
  MEDIUM:   { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: AlertTriangle },
  LOW:      { color: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: CheckCircle2 },
};

const PLAN_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  refonte:      { label: "Complete Overhaul", color: "text-red-500",     icon: XCircle },
  optimisation: { label: "Optimization",     color: "text-yellow-500",  icon: Zap },
  acceleration: { label: "Acceleration",     color: "text-emerald-500", icon: TrendingUp },
};

// ─── Sub-Components ────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = "#0F6E56";
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" className="text-[var(--border-color)]" strokeWidth="3" />
        <circle
          cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="text-center">
        <div className="text-4xl font-medium text-[#0F6E56]">{score}</div>
        <div className="text-xs text-[var(--text-muted)] font-normal">/ 100</div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, highlight }: any) {
  return (
    <div className="relative bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4 flex items-center gap-4 hover:border-[#0F6E56]/30 transition-colors duration-150">
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

function ModeCard({ title, icon: Icon, mode, currentMode, disabled, locked, onClick }: any) {
  const isActive = mode === currentMode;
  return (
    <button 
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 flex items-center gap-2
        ${isActive ? 'bg-[#0F6E56] text-white border-[#0F6E56]' : 'bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{title}</span>
      {locked && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-warning-main)] ml-1">Plan required</span>
      )}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs h-7 gap-1.5">
      {copied ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

function GeneratedContentView({ type, content }: { type: string; content: any }) {
  if (!content || typeof content !== "object") {
    return <p className="text-sm text-muted-foreground italic">Generated content available — no details to display.</p>;
  }
  const t = type.toUpperCase();

  if (content.type === "manual" || t === "PROFILE" || t === "BIO") {
    return (
      <div className="space-y-3">
          <p className="text-sm font-semibold text-primary">{content.title || "Manual action"}</p>
        <p className="text-sm">{content.instructions || content.content?.instructions}</p>
        {(content.cta || content.content?.cta) && (
          <p className="text-xs text-muted-foreground">CTA: <span className="italic">{content.cta || content.content?.cta}</span></p>
        )}
        {(content.tip || content.content?.tip) && (
          <p className="text-xs text-amber-500">{content.tip || content.content?.tip}</p>
        )}
        <CopyButton text={`${content.instructions || ""} — CTA: ${content.cta || ""}`} />
      </div>
    );
  }

  if (t.includes("REEL") || t.includes("VIDEO") || t.includes("STORY")) {
    const c = content.content || content;
    return (
      <div className="space-y-3">
        {c.title && <p className="text-sm font-semibold">{c.title}</p>}
        {c.hook && (
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <p className="text-xs font-bold text-purple-400 uppercase mb-1">Hook</p>
            <p className="text-sm">{c.hook}</p>
          </div>
        )}
        {c.body && (
          <div className="p-3 rounded-lg bg-background/60 border border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Script body</p>
            <p className="text-sm whitespace-pre-line">{c.body}</p>
          </div>
        )}
        {c.cta && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs font-bold text-primary uppercase mb-1">CTA</p>
            <p className="text-sm">{c.cta}</p>
          </div>
        )}
        <CopyButton text={`${c.hook || ""} \n\n${c.body || ""} \n\n${c.cta || ""}`} />
      </div>
    );
  }

  if (t.includes("POST") || t.includes("CAROUSEL") || t.includes("IMAGE")) {
    const c = content.content || content;
    return (
      <div className="space-y-3">
        {c.cover && (
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs font-bold text-blue-400 uppercase mb-1">Cover slide</p>
            <p className="text-sm font-semibold">{c.cover}</p>
          </div>
        )}
        {Array.isArray(c.slides) && c.slides.length > 0 && (
          <div className="space-y-2">
            {c.slides.map((slide: string, i: number) => (
              <div key={i} className="p-2 rounded-lg bg-background/60 border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">Slide {i + 1}</p>
                <p className="text-sm">{slide}</p>
              </div>
            ))}
          </div>
        )}
        {c.caption && <p className="text-xs text-muted-foreground italic">Caption: {c.caption}</p>}
        <CopyButton text={[c.cover, ...(c.slides || []), c.caption].filter(Boolean).join("\n\n")} />
      </div>
    );
  }

  if (t.includes("QUIZ") || t.includes("QA")) {
    const c = content.content || content;
    const questions = c.questions || [];
    return (
      <div className="space-y-3">
        {questions.map((q: any, i: number) => (
          <div key={i} className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-sm font-semibold mb-2">{i + 1}. {q.question}</p>
            {Array.isArray(q.options) && (
              <ul className="space-y-1">
                {q.options.map((opt: string, j: number) => (
                  <li key={j} className={`text-xs px-2 py-1 rounded ${opt === q.answer ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                    {opt === q.answer ? "✓ " : ""}{opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <CopyButton text={questions.map((q: any) => `${q.question}\nAnswer: ${q.answer}`).join("\n\n")} />
      </div>
    );
  }

  // Generic curriculum / default
  const c = content.content || content;
  return (
    <div className="space-y-3">
      {c.title && <p className="text-sm font-semibold">{c.title}</p>}
      {c.summary && <p className="text-sm text-muted-foreground">{c.summary}</p>}
      {Array.isArray(c.takeaways) && (
        <ul className="space-y-1">
          {c.takeaways.map((t: string, i: number) => (
            <li key={i} className="text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{t}</li>
          ))}
        </ul>
      )}
      <CopyButton text={[c.title, c.summary, ...(c.takeaways || [])].filter(Boolean).join("\n")} />
    </div>
  );
}

function TaskCard({ action, userId, onAction, currentMode }: any) {
  const [status, setStatus] = useState<string>(action.status || "pending");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);

  const typeColors: Record<string, string> = {
    reel:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
    video:    "bg-purple-500/10 text-purple-400 border-purple-500/20",
    carousel: "bg-blue-500/10   text-blue-400   border-blue-500/20",
    post:     "bg-blue-500/10   text-blue-400   border-blue-500/20",
    quiz:     "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    story:    "bg-pink-500/10   text-pink-400   border-pink-500/20",
    profile:  "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    bio:      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dm:       "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };
  const typeClass = typeColors[action.content_type?.toLowerCase()] ?? "bg-primary/10 text-primary border-primary/20";
  
  const STATUS_COLORS: Record<string, string> = {
    pending:  "text-muted-foreground bg-muted",
    draft:    "text-amber-500 bg-amber-500/10",
    approved: "text-emerald-500 bg-emerald-500/10",
    skipped:  "text-rose-500 bg-rose-500/10",
    done:     "text-emerald-600 bg-emerald-500/10",
  };
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.pending;

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/orchestrator/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: action.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation error");
      if (data.skipped) {
        setStatus("skipped");
        setGenError(data.error || "Skipped: Already generated");
      } else {
        setGeneratedContent(data.content);
        setStatus("done");
        setShowContent(true);
      }
    } catch (e: any) {
      setGenError(e.message || "Generation error, please retry.");
      setStatus("failed");
    } finally {
      setGenerating(false);
    }
  };

  const isDone = status === "done" || status === "approved";
  const isFailed = status === "failed";
  const isRunning = status === "running" || generating;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 transition-all bg-card ${
        isDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"
      }`}>
      {/* Task Header */}
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

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          {status === "planned" && currentMode === "semi_auto" && (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isRunning}
              className="text-xs h-8 gap-1.5 min-w-[110px]"
            >
              {isRunning ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
              ) : (
                <>⚡ Generate</>
              )}
            </Button>
          )}

          {isFailed && (
            <Button size="sm" onClick={handleGenerate} disabled={isRunning} variant="outline" className="text-xs h-8 text-rose-500">
              {isRunning ? "Retrying..." : "Retry"}
            </Button>
          )}

          {isDone && (
            <Button size="sm" variant="outline" onClick={() => setShowContent(v => !v)} className="text-xs h-8">
              {showContent ? "Hide" : "View Draft"}
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {genError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {genError}
        </div>
      )}

      {/* Generated content display */}
      <AnimatePresence>
        {showContent && generatedContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border overflow-hidden"
          >
            <GeneratedContentView type={action.content_type || ""} content={generatedContent} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MonthSection({ monthNum, plans, currentMode, onAction, userId }: any) {
  const [collapsed, setCollapsed] = useState(monthNum > 1);
  const monthPlans = plans.filter((p: ActionPlanItem) =>
    monthNum === 1 ? p.week_number <= 4 :
    monthNum === 2 ? p.week_number >= 5 && p.week_number <= 8 :
    p.week_number >= 9
  );
  const weeks = Array.from(new Set(monthPlans.map((p: ActionPlanItem) => p.week_number))).sort() as number[];
  const accepted = monthPlans.filter((p: ActionPlanItem) => p.status === "approved" || p.status === "done").length;
  if (monthPlans.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
      <button className="w-full flex items-center justify-between p-6 text-left hover:bg-card/60 transition-colors" onClick={() => setCollapsed(v => !v)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary">M{monthNum}</div>
          <div>
            <p className="font-bold">Month {monthNum}</p>
            <p className="text-sm text-muted-foreground">{monthPlans.length} tasks · {accepted} approved/completed</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {accepted > 0 && <div className="text-xs text-emerald-500 font-bold">{Math.round((accepted / monthPlans.length) * 100)}%</div>}
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
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
                    <TaskCard key={action.id} action={action} userId={userId} currentMode={currentMode} onAction={onAction} />
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

/** Renders the plan_display field — handles both structured JSON and raw fallback text */
function PlanDisplay({ planDisplay }: { planDisplay: PlanDisplay | null }) {
  if (!planDisplay) return null;
  if (planDisplay.type === "raw_text_plan") {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-bold text-yellow-500">Raw plan (partially truncated JSON)</span>
        </div>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto">
          {typeof planDisplay.content === "string" ? planDisplay.content : JSON.stringify(planDisplay.content, null, 2)}
        </pre>
      </div>
    );
  }
  // structured_plan — render the keys nicely
  const content = planDisplay.content;
  if (!content || typeof content !== "object") return null;
  return (
    <div className="space-y-3">
      {Object.entries(content).map(([k, v]) => (
        <div key={k} className="rounded-xl border border-border bg-card/40 p-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{k.replace(/_/g, " ")}</p>
          <p className="text-sm text-muted-foreground">
            {typeof v === "string" ? v : Array.isArray(v) ? v.join(", ") : JSON.stringify(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function AuditDashboard({ user, audit, todayTasks, pendingDrafts }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "errors" | "revenue" | "ai">("overview");
  const [taskStates, setTaskStates] = useState<Record<string, "pending" | "accepted" | "skipped">>({});
  const [loggingOut, setLoggingOut] = useState(false);
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  // Analysis Form State
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [niche, setNiche] = useState("");
  const [formAudience, setFormAudience] = useState("");
  const [goals, setGoals] = useState("");
  const [preferences, setPreferences] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const planLevel = user?.userProfile?.plan || "libre";
  const currentMode = user?.automationPrefs?.mode || "libre";

  let plans = audit.actionPlans || [];
  const aiReport: any = audit.ai_report_json ?? {};

  // Fallback : afficher depuis ai_report_json si ActionPlans absents
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
            id: `fallback-${m}-${semaine.semaine || semaine.week || '1'}-${action.jour || action.day_of_week || '1'}`,
            week_number: Number(semaine.semaine || semaine.week || semaine.week_number || (m * 4 - 3)),
            day_of_week: action.jour || action.day || action.day_of_week || 'Lundi',
            content_type: action.type || action.content_type || 'Reel',
            topic: action.sujet || action.topic || action.action || '',
            cta: action.cta || action.call_to_action || '',
            optimal_hour: action.heure || action.heure_optimale || action.optimal_hour || '19h',
            status: 'pending',
            isFallback: true, // pour afficher un badge "Non synchronisé"
          });
        }
      }
    }
    plans = fallbackActions;
  }

  const handleModeChange = async (newMode: string) => {
    if (newMode === "semi_auto" && plans.length === 0 && !showAnalysisForm) {
      setShowAnalysisForm(true);
      return;
    }

    setIsChangingMode(true);
    setModeError(null);
    try {
      const res = await fetch("/api/automation/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error changing mode");
      }
      router.refresh();
    } catch (e: any) {
      setModeError(e.message);
    } finally {
      setIsChangingMode(false);
    }
  };

  const handleAnalysisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setModeError(null);
    try {
      const planRes = await fetch("/api/orchestrator/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, audience: formAudience, goals, preferences })
      });
      if (!planRes.ok) throw new Error("Failed to generate plan");
      
      const res = await fetch("/api/automation/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "semi_auto" })
      });
      if (!res.ok) throw new Error("Error changing mode");
      
      setShowAnalysisForm(false);
      router.refresh();
    } catch (e: any) {
      setModeError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAction = async (taskId: string, action: string) => {
    if (action === "approve" || action === "skip" || action === "edit") {
      try {
        await fetch("/api/automation/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: taskId, action })
        });
        router.refresh();
      } catch (e) {
        console.error("Automation action failed:", e);
      }
    }
  };

  const errors: AuditError[] = Array.isArray(audit.errors_json) ? audit.errors_json : [];
  const metrics: Metrics     = (audit.metrics_json as Metrics) ?? {};
  const revenue: RevenueEstimation = (audit.revenue_estimation_json as RevenueEstimation) ?? {};
  const profile: any         = audit.profile_json ?? {};
  const audienceData: Audience   = (audit.audience_json as Audience) ?? {};

  const planDisplay: PlanDisplay | null = aiReport?.plan_display ?? null;
  const auditSummary: any = aiReport?.audit_summary ?? null;

  const planCfg = PLAN_TYPE_CONFIG[audit.plan_type ?? ""] ?? { label: audit.plan_type ?? "—", color: "text-primary", icon: Star };
  const PlanIcon = planCfg.icon;
  const acceptedCount = Object.values(taskStates).filter(s => s === "accepted").length;
  const totalTasks    = plans.length;
  const progressPct   = totalTasks > 0 ? Math.round((acceptedCount / totalTasks) * 100) : 0;

  const engagementData = useMemo(() => [
    { name: "Before audit",   value: Math.max((metrics.engagement_rate ?? 2) - 1.5, 0.5) },
    { name: "Semaine 1",   value: metrics.engagement_rate ?? 2 },
    { name: "Target M1", value: (metrics.engagement_rate ?? 2) + 0.8 },
    { name: "Target M2", value: (metrics.engagement_rate ?? 2) + 2 },
    { name: "Target M3", value: (metrics.engagement_rate ?? 2) + 3.5 },
  ], [metrics.engagement_rate]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "errors",   label: `Errors (${errors.length})`, icon: AlertTriangle },
    { id: "revenue",  label: "Revenue", icon: DollarSign },
    { id: "ai",       label: "AI Report", icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl italic tracking-tight" style={{ fontFamily: "var(--font-playfair), 'Georgia', 'Times New Roman', serif" }}>Audit Report</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-muted-foreground">
              @{profile.username ?? "—"}
            </p>
            {profile.is_verified && (
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">✓ Verified</Badge>
            )}
            {aiReport?.account_size && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{aiReport.account_size}</Badge>
            )}
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
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut}
            className="text-muted-foreground border-border hover:text-foreground hover:bg-muted gap-2">
            <LogOut className="w-4 h-4" />
            {loggingOut ? "..." : "Logout"}
          </Button>
        </div>
      </div>

      {modeError && (
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/20 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {modeError}
        </div>
      )}

      {/* ── Modes Selector ── */}
      <Card className="bg-card/40 border-primary/10">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Operating Mode</CardTitle>
              <CardDescription>Current plan: <strong className="text-primary uppercase">{planLevel}</strong></CardDescription>
            </div>
            {(currentMode === "semi_auto" || currentMode === "auto") && (
              <Button variant="destructive" onClick={() => handleModeChange("libre")} disabled={isChangingMode}>
                Stop Automations
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <ModeCard 
            title="Libre" icon={Zap} mode="libre" 
            currentMode={currentMode} 
            onClick={() => handleModeChange("libre")}
            disabled={isChangingMode}
          />
          <ModeCard 
            title="Semi-Auto" icon={Activity} mode="semi_auto" 
            currentMode={currentMode} 
            disabled={planLevel !== "autopilote" || isChangingMode}
            locked={planLevel !== "autopilote"}
            onClick={() => handleModeChange("semi_auto")}
          />
          <ModeCard 
            title="Auto" icon={Activity} mode="auto" 
            currentMode={currentMode} 
            disabled={planLevel !== "autopilote" || isChangingMode}
            locked={planLevel !== "autopilote"}
            onClick={() => handleModeChange("auto")}
          />
        </CardContent>
      </Card>

      {/* The raw auditSummary JSON banner has been removed, as the data is already presented in the cards below */}

      {/* ── Score + Plan Type + Profile ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 flex items-center justify-center py-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <div className="text-center space-y-4">
            <ScoreRing score={audit.score ?? 0} />
            <div>
              <p className="text-sm text-muted-foreground">Global Score</p>
              <div className={`flex items-center justify-center gap-1.5 mt-1 font-bold ${planCfg.color}`}>
                <PlanIcon className="w-4 h-4" />
                {planCfg.label}
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
            <div className="text-center p-3 bg-background/60 rounded-lg col-span-full sm:col-span-1">
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
            {profile.external_link && (
              <div className="col-span-full flex items-center gap-2 p-2 rounded-lg bg-background/40">
                <Globe className="w-3 h-3 text-primary shrink-0" />
                <a href={profile.external_link} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate">{profile.external_link}</a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Audience row (if present) ── */}
      {(audienceData.top_country || audienceData.top_age_group || audienceData.gender_split || audienceData.active_hours) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {audienceData.top_country   && <MetricCard icon={Globe}    label="Main Country"   value={audienceData.top_country} />}
          {audienceData.top_age_group && <MetricCard icon={Users}    label="Age Range"    value={audienceData.top_age_group} />}
          {audienceData.gender_split  && <MetricCard icon={Activity} label="Gender"             value={audienceData.gender_split} />}
          {audienceData.active_hours  && <MetricCard icon={Clock}    label="Active Hours"   value={audienceData.active_hours} />}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} id={`tab-${tab.id}`} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center
                ${activeTab === tab.id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Key Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard icon={Activity}    label="Engagement Rate"      value={metrics.engagement_rate != null ? `${metrics.engagement_rate}%` : null} sub="Target: > 3%" highlight={metrics.engagement_rate != null && metrics.engagement_rate > 3} />
                <MetricCard icon={Eye}         label="Reach Ratio"        value={metrics.reach_ratio != null ? `${metrics.reach_ratio}%` : null} />
                <MetricCard icon={Bookmark}    label="Save Rate"     value={metrics.save_rate != null ? `${metrics.save_rate}%` : null} />
                <MetricCard icon={TrendingUp}  label="Post Frequency"      value={metrics.posting_frequency} />
                <MetricCard icon={Video}       label="Reel Share"          value={metrics.reel_ratio != null ? `${(metrics.reel_ratio * 100).toFixed(0)}%` : null} />
                <MetricCard icon={ExternalLink} label="Bio Clicks (30D)"       value={metrics.bio_clicks} />
                {metrics.avg_likes    != null && <MetricCard icon={Star}     label="Avg. Likes"    value={metrics.avg_likes?.toLocaleString("en-US")} />}
                {metrics.avg_comments != null && <MetricCard icon={Users}    label="Avg. Comments" value={metrics.avg_comments?.toLocaleString("en-US")} />}
                {metrics.avg_views    != null && <MetricCard icon={Eye}      label="Avg. Views"     value={metrics.avg_views?.toLocaleString("en-US")} />}
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

        {/* ── ERRORS TAB ── */}
        {activeTab === "errors" && (
          <motion.div key="errors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
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

        {/* ── REVENUE TAB ── */}
        {activeTab === "revenue" && (
          <motion.div key="revenue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Revenue Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 border-emerald-500/20">
                  <CardHeader>
                    <CardTitle className="text-emerald-500 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Monthly Potential</CardTitle>
                    <CardDescription>Based on your profile and offer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-background/60">
                        <p className="text-2xl font-black text-emerald-500">{revenue.monthly_leads ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/60">
                        <p className="text-2xl font-black text-blue-500">{revenue.monthly_sales ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">Sales</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/60">
                        <p className="text-2xl font-black text-purple-500">
                          {revenue.monthly_revenue_eur != null ? `${revenue.monthly_revenue_eur.toLocaleString("en-US")}€` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {revenue.conversion_rate != null && (
                        <div className="p-3 rounded-lg bg-background/60 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
                          <p className="font-bold text-lg">{(revenue.conversion_rate * 100).toFixed(1)}%</p>
                        </div>
                      )}
                      {revenue.revenue_per_post != null && (
                        <div className="p-3 rounded-lg bg-background/60 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Revenue / post</p>
                          <p className="font-bold text-lg">{revenue.revenue_per_post.toLocaleString("en-US")}€</p>
                        </div>
                      )}
                      {revenue.cpa != null && (
                        <div className="p-3 rounded-lg bg-background/60 text-center col-span-full">
                          <p className="text-xs text-muted-foreground mb-1">Cost per Acquisition (CPA)</p>
                          <p className="font-bold text-lg">{revenue.cpa.toLocaleString("en-US")}€</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">3-Month Projection</CardTitle>
                    <CardDescription>Estimate with the plan in place</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[
                        { name: "Current", leads: revenue.monthly_leads ?? 0, revenue: revenue.monthly_revenue_eur ?? 0 },
                        { name: "+30J",   leads: Math.round((revenue.monthly_leads ?? 0) * 1.4), revenue: Math.round((revenue.monthly_revenue_eur ?? 0) * 1.4) },
                        { name: "+60J",   leads: Math.round((revenue.monthly_leads ?? 0) * 1.9), revenue: Math.round((revenue.monthly_revenue_eur ?? 0) * 1.9) },
                        { name: "+90J",   leads: Math.round((revenue.monthly_leads ?? 0) * 2.8), revenue: Math.round((revenue.monthly_revenue_eur ?? 0) * 2.8) },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="leads"   name="Leads"  fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                        <Bar dataKey="revenue" name="Revenu (€)" fill="#10b981"         radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── AI REPORT TAB ── */}
        {activeTab === "ai" && (
          <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Complete AI Report</h2>

              {!aiReport || Object.keys(aiReport).length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>AI report not available for this audit.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {planDisplay && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">Content Plan (n8n)</CardTitle></CardHeader>
                      <CardContent><PlanDisplay planDisplay={planDisplay} /></CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Action Plan</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">90-Day Action Plan</h2>
                {totalTasks > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">{acceptedCount}/{totalTasks} approved</div>
                    <div className="w-40 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="text-sm font-bold text-primary">{progressPct}%</div>
                  </div>
                )}
              </div>
              
              <MonthSection monthNum={1} plans={plans} currentMode={currentMode} onAction={handleAction} userId={user?.id} />
              <MonthSection monthNum={2} plans={plans} currentMode={currentMode} onAction={handleAction} userId={user?.id} />
              <MonthSection monthNum={3} plans={plans} currentMode={currentMode} onAction={handleAction} userId={user?.id} />
            </div>

          </div>
        </div>
      </div>

      {/* Modal for Analysis Form */}
      <AnimatePresence>
        {showAnalysisForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card w-full max-w-lg rounded-xl shadow-xl border border-border p-6 relative overflow-y-auto max-h-[90vh]">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setShowAnalysisForm(false)}><XCircle className="w-5 h-5" /></Button>
              <h2 className="text-2xl font-bold mb-2">Deep Profile Analysis</h2>
              <p className="text-sm text-muted-foreground mb-6">Tell us about your strategy to generate a personalized 90-day action plan.</p>
              <form onSubmit={handleAnalysisSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Main Niche</Label>
                  <Input required placeholder="e.g. Fitness, Real Estate, Coaching..." value={niche} onChange={e => setNiche(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input required placeholder="Who are you trying to reach?" value={formAudience} onChange={e => setFormAudience(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Main Goals</Label>
                  <Input required placeholder="e.g. More sales, followers, engagement..." value={goals} onChange={e => setGoals(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Content Preferences</Label>
                  <Textarea placeholder="Any specific topics or formats you like?" value={preferences} onChange={e => setPreferences(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isAnalyzing}>
                  {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Analyzing your profile...</> : "Start Deep Analysis"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
