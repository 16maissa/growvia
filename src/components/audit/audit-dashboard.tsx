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
  Star, Zap, ArrowRight, BarChart2, FileText, Globe, Clock, LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  refonte:      { label: "Refonte Complète", color: "text-red-500",     icon: XCircle },
  optimisation: { label: "Optimisation",     color: "text-yellow-500",  icon: Zap },
  acceleration: { label: "Accélération",     color: "text-emerald-500", icon: TrendingUp },
};

// ─── Sub-Components ────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" className="text-border" strokeWidth="8" />
        <circle
          cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="text-center">
        <div className="text-4xl font-black" style={{ color }}>{score}</div>
        <div className="text-xs text-muted-foreground font-medium">/ 100</div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, highlight }: any) {
  return (
    <div className={`bg-card border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors ${highlight ? "border-primary/40" : "border-border"}`}>
      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-bold truncate">{value ?? "—"}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
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
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Impact sur les ventes</p>
              <p className="text-sm">{error.impact_on_sales}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Recommandation IA</p>
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
    <div 
      onClick={disabled ? undefined : onClick}
      className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center
        ${isActive ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20' : 'border-border bg-background/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
      `}
    >
      {locked && (
        <Badge variant="destructive" className="absolute -top-2 text-[10px] py-0">Plan requis</Badge>
      )}
      <Icon className={`w-8 h-8 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={`font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>{title}</span>
    </div>
  );
}

function TaskCard({ action, onAction, currentMode }: any) {
  const typeColors: Record<string, string> = {
    reel:     "bg-purple-500/10 text-purple-400 border-purple-500/20",
    carousel: "bg-blue-500/10   text-blue-400   border-blue-500/20",
    quiz:     "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    caption:  "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    story:    "bg-pink-500/10   text-pink-400   border-pink-500/20",
  };
  const typeClass = typeColors[action.content_type?.toLowerCase()] ?? "bg-primary/10 text-primary border-primary/20";
  
  const statusColors = {
    pending: "text-muted-foreground bg-muted",
    draft: "text-amber-500 bg-amber-500/10",
    approved: "text-emerald-500 bg-emerald-500/10",
    skipped: "text-rose-500 bg-rose-500/10",
    done: "text-blue-500 bg-blue-500/10",
  };
  const statusColor = statusColors[action.status as keyof typeof statusColors] || statusColors.pending;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 transition-all bg-card ${action.status === 'approved' || action.status === 'done' ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={`text-xs border ${typeClass}`}>{action.content_type?.toUpperCase()}</Badge>
            <span className="text-xs text-muted-foreground capitalize">{action.day_of_week} · {action.optimal_hour ?? "–"}</span>
            <Badge variant="outline" className={`text-[10px] ml-2 ${statusColor}`}>{action.status}</Badge>
            {action.isFallback && (
              <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-500 bg-orange-500/10">Non sync</Badge>
            )}
          </div>
          <p className="font-medium text-sm">{action.topic}</p>
          {action.cta && <p className="text-xs text-muted-foreground mt-1">CTA: <span className="italic">{action.cta}</span></p>}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {(currentMode === "libre" || currentMode === "guide") && (
            <Button size="sm" onClick={() => onAction(action.id, "generate")} className="text-xs h-8">
              Générer
            </Button>
          )}
          {currentMode === "semi" && action.status === "draft" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onAction(action.id, "approve")} className="text-xs h-8 bg-emerald-500 hover:bg-emerald-600 text-white">Approuver</Button>
              <Button size="sm" variant="outline" onClick={() => onAction(action.id, "edit")} className="text-xs h-8">Modifier</Button>
              <Button size="sm" variant="ghost" onClick={() => onAction(action.id, "skip")} className="text-xs h-8 text-rose-500">Ignorer</Button>
            </div>
          )}
          {currentMode === "semi" && action.status === "pending" && (
            <span className="text-xs text-muted-foreground italic">En attente de génération...</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MonthSection({ monthNum, plans, currentMode, onAction }: any) {
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
            <p className="font-bold">Mois {monthNum}</p>
            <p className="text-sm text-muted-foreground">{monthPlans.length} actions · {accepted} acceptées/terminées</p>
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
                  <div className="h-px flex-1 bg-border" /> Semaine {w} <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-3">
                  {monthPlans.filter((p: ActionPlanItem) => p.week_number === w).map((action: ActionPlanItem) => (
                    <TaskCard key={action.id} action={action} currentMode={currentMode} onAction={onAction} />
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
          <span className="text-sm font-bold text-yellow-500">Plan brut (JSON partiellement tronqué)</span>
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
  const [activeTab, setActiveTab] = useState<"overview" | "errors" | "plan" | "revenue" | "ai">("overview");
  const [taskStates, setTaskStates] = useState<Record<string, "pending" | "accepted" | "skipped">>({});
  const [loggingOut, setLoggingOut] = useState(false);
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  const planLevel = user?.userProfile?.plan || "libre";
  const currentMode = user?.automationPrefs?.mode || "libre";

  const handleModeChange = async (newMode: string) => {
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
        throw new Error(data.error || "Erreur lors du changement de mode");
      }
      router.refresh();
    } catch (e: any) {
      setModeError(e.message);
    } finally {
      setIsChangingMode(false);
    }
  };

  const handleAction = async (taskId: string, action: string) => {
    // For now, this is a placeholder. You'll connect this to /api/automation/approve later.
    console.log("Action", action, "on task", taskId);
  };

  const errors: AuditError[] = Array.isArray(audit.errors_json) ? audit.errors_json : [];
  const metrics: Metrics     = (audit.metrics_json as Metrics) ?? {};
  const revenue: RevenueEstimation = (audit.revenue_estimation_json as RevenueEstimation) ?? {};
  const profile: any         = audit.profile_json ?? {};
  const audience: Audience   = (audit.audience_json as Audience) ?? {};
  let plans = audit.actionPlans || [];

  // ai_report_json may contain plan_display key too (stored from n8n output)
  const aiReport: any  = audit.ai_report_json ?? {};

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

  const planDisplay: PlanDisplay | null = aiReport?.plan_display ?? null;
  const auditSummary: any = aiReport?.audit_summary ?? null;

  const planCfg = PLAN_TYPE_CONFIG[audit.plan_type ?? ""] ?? { label: audit.plan_type ?? "—", color: "text-primary", icon: Star };
  const PlanIcon = planCfg.icon;
  const acceptedCount = Object.values(taskStates).filter(s => s === "accepted").length;
  const totalTasks    = plans.length;
  const progressPct   = totalTasks > 0 ? Math.round((acceptedCount / totalTasks) * 100) : 0;

  const engagementData = useMemo(() => [
    { name: "Av. audit",   value: Math.max((metrics.engagement_rate ?? 2) - 1.5, 0.5) },
    { name: "Semaine 1",   value: metrics.engagement_rate ?? 2 },
    { name: "Objectif M1", value: (metrics.engagement_rate ?? 2) + 0.8 },
    { name: "Objectif M2", value: (metrics.engagement_rate ?? 2) + 2 },
    { name: "Objectif M3", value: (metrics.engagement_rate ?? 2) + 3.5 },
  ], [metrics.engagement_rate]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
  }

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: BarChart2 },
    { id: "errors",   label: `Erreurs (${errors.length})`, icon: AlertTriangle },
    { id: "plan",     label: `Plan 90J (${plans.length})`, icon: Target },
    { id: "revenue",  label: "Revenus", icon: DollarSign },
    { id: "ai",       label: "Rapport IA", icon: FileText },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Rapport d'Audit</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-muted-foreground">
              @{profile.username ?? "—"}
            </p>
            {profile.is_verified && (
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">✓ Vérifié</Badge>
            )}
            {aiReport?.account_size && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{aiReport.account_size}</Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(audit.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {errors.filter(e => e.severity === "CRITICAL").length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              {errors.filter(e => e.severity === "CRITICAL").length} critique(s)
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={loggingOut}
            className="text-muted-foreground border-border hover:text-foreground hover:bg-muted gap-2">
            <LogOut className="w-4 h-4" />
            {loggingOut ? "..." : "Déconnexion"}
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
              <CardTitle>Mode de fonctionnement</CardTitle>
              <CardDescription>Plan actuel : <strong className="text-primary uppercase">{planLevel}</strong></CardDescription>
            </div>
            {(currentMode === "semi" || currentMode === "auto") && (
              <Button variant="destructive" onClick={() => handleModeChange("guide")} disabled={isChangingMode}>
                Suspendre l'Agent
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ModeCard 
            title="Libre" icon={Zap} mode="libre" 
            currentMode={currentMode} 
            onClick={() => handleModeChange("libre")}
            disabled={isChangingMode}
          />
          <ModeCard 
            title="Guide" icon={Globe} mode="guide" 
            currentMode={currentMode} 
            disabled={planLevel === "libre" || isChangingMode}
            locked={planLevel === "libre"}
            onClick={() => handleModeChange("guide")}
          />
          <ModeCard 
            title="Semi-Auto" icon={Activity} mode="semi" 
            currentMode={currentMode} 
            disabled={planLevel !== "autopilote" || isChangingMode}
            locked={planLevel !== "autopilote"}
            onClick={() => handleModeChange("semi")}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 flex items-center justify-center py-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <div className="text-center space-y-4">
            <ScoreRing score={audit.score ?? 0} />
            <div>
              <p className="text-sm text-muted-foreground">Score global</p>
              <div className={`flex items-center justify-center gap-1.5 mt-1 font-bold ${planCfg.color}`}>
                <PlanIcon className="w-4 h-4" />
                {planCfg.label}
              </div>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 bg-card/40">
          <CardHeader><CardTitle className="text-base">Profil Instagram</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-background/60 rounded-lg">
              <p className="text-2xl font-black">{profile.followers?.toLocaleString("fr-FR") ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Abonnés</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-lg">
              <p className="text-2xl font-black">{profile.following?.toLocaleString("fr-FR") ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Abonnements</p>
            </div>
            <div className="text-center p-3 bg-background/60 rounded-lg">
              <p className="text-2xl font-black">{profile.posts_count ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Publications</p>
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
      {(audience.top_country || audience.top_age_group || audience.gender_split || audience.active_hours) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {audience.top_country   && <MetricCard icon={Globe}    label="Pays principal"   value={audience.top_country} />}
          {audience.top_age_group && <MetricCard icon={Users}    label="Tranche d'âge"    value={audience.top_age_group} />}
          {audience.gender_split  && <MetricCard icon={Activity} label="Genre"             value={audience.gender_split} />}
          {audience.active_hours  && <MetricCard icon={Clock}    label="Heures actives"   value={audience.active_hours} />}
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
              <h2 className="text-xl font-bold">Métriques Clés</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard icon={Activity}    label="Taux d'engagement"      value={metrics.engagement_rate != null ? `${metrics.engagement_rate}%` : null} sub="Cible: > 3%" highlight={metrics.engagement_rate != null && metrics.engagement_rate > 3} />
                <MetricCard icon={Eye}         label="Ratio de portée"        value={metrics.reach_ratio != null ? `${metrics.reach_ratio}%` : null} />
                <MetricCard icon={Bookmark}    label="Taux de sauvegarde"     value={metrics.save_rate != null ? `${metrics.save_rate}%` : null} />
                <MetricCard icon={TrendingUp}  label="Fréquence de post"      value={metrics.posting_frequency} />
                <MetricCard icon={Video}       label="Part de Reels"          value={metrics.reel_ratio != null ? `${(metrics.reel_ratio * 100).toFixed(0)}%` : null} />
                <MetricCard icon={ExternalLink} label="Clics bio (30J)"       value={metrics.bio_clicks} />
                {metrics.avg_likes    != null && <MetricCard icon={Star}     label="Moy. Likes"    value={metrics.avg_likes?.toLocaleString("fr-FR")} />}
                {metrics.avg_comments != null && <MetricCard icon={Users}    label="Moy. Commentaires" value={metrics.avg_comments?.toLocaleString("fr-FR")} />}
                {metrics.avg_views    != null && <MetricCard icon={Eye}      label="Moy. Vues"     value={metrics.avg_views?.toLocaleString("fr-FR")} />}
              </div>

              <h2 className="text-xl font-bold mt-8">Projection d'Engagement</h2>
              <Card>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis unit="%" tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => `${v}%`} />
                      <ReferenceLine y={3} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Cible 3%", fill: "#10b981", fontSize: 11 }} />
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
                <h2 className="text-xl font-bold">Erreurs Détectées</h2>
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
                  <p>Aucune erreur critique détectée 🎉</p>
                </div>
              ) : (
                errors
                  .sort((a, b) => ({ CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 }[a.severity] ?? 4) - ({ CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 }[b.severity] ?? 4))
                  .map((err, i) => <ErrorCard key={i} error={err} />)
              )}
            </div>
          </motion.div>
        )}

        {/* ── PLAN TAB ── */}
        {activeTab === "plan" && (
          <motion.div key="plan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Plan d'Action 90 Jours</h2>
                {totalTasks > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">{acceptedCount}/{totalTasks} acceptées</div>
                    <div className="w-40 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="text-sm font-bold text-primary">{progressPct}%</div>
                  </div>
                )}
              </div>

              {plans.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground border rounded-xl bg-card">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="mb-4">Aucune tâche planifiée pour l'instant.</p>
                  <Button variant="outline" onClick={() => window.location.href = '/settings'}>Relancer l'analyse</Button>
                </div>
              ) : (
                [1, 2, 3].map(m => (
                  <MonthSection key={m} monthNum={m} plans={plans}
                    currentMode={currentMode}
                    onAction={handleAction}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ── REVENUE TAB ── */}
        {activeTab === "revenue" && (
          <motion.div key="revenue" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Insights Revenus</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 border-emerald-500/20">
                  <CardHeader>
                    <CardTitle className="text-emerald-500 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Potentiel mensuel</CardTitle>
                    <CardDescription>Basé sur votre profil et votre offre</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-background/60">
                        <p className="text-2xl font-black text-emerald-500">{revenue.monthly_leads ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/60">
                        <p className="text-2xl font-black text-blue-500">{revenue.monthly_sales ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">Ventes</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/60">
                        <p className="text-2xl font-black text-purple-500">
                          {revenue.monthly_revenue_eur != null ? `${revenue.monthly_revenue_eur.toLocaleString("fr-FR")}€` : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">Revenu</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {revenue.conversion_rate != null && (
                        <div className="p-3 rounded-lg bg-background/60 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Taux de conversion</p>
                          <p className="font-bold text-lg">{(revenue.conversion_rate * 100).toFixed(1)}%</p>
                        </div>
                      )}
                      {revenue.revenue_per_post != null && (
                        <div className="p-3 rounded-lg bg-background/60 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Revenu / post</p>
                          <p className="font-bold text-lg">{revenue.revenue_per_post.toLocaleString("fr-FR")}€</p>
                        </div>
                      )}
                      {revenue.cpa != null && (
                        <div className="p-3 rounded-lg bg-background/60 text-center col-span-full">
                          <p className="text-xs text-muted-foreground mb-1">Coût par acquisition (CPA)</p>
                          <p className="font-bold text-lg">{revenue.cpa.toLocaleString("fr-FR")}€</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Projection sur 3 mois</CardTitle>
                    <CardDescription>Estimation avec le plan en place</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[
                        { name: "Actuel", leads: revenue.monthly_leads ?? 0, revenue: revenue.monthly_revenue_eur ?? 0 },
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
              <h2 className="text-xl font-bold">Rapport Complet de l'IA</h2>

              {!aiReport || Object.keys(aiReport).length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Rapport IA non disponible pour cet audit.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {planDisplay && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">Plan de contenu (n8n)</CardTitle></CardHeader>
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
  );
}
