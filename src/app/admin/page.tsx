"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users, FileText, MessageSquare, Bot, TrendingUp, AlertTriangle,
  CheckCircle2, Activity, Database, Send, RefreshCw, Shield,
  Zap, Trash2, ChevronLeft, ChevronRight, Search, Video,
  BookOpen, BarChart3, Leaf, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = {
  users: { total: number; today: number; last7: number; last30: number; plans: Record<string, number> };
  content: { documents: number; courses: number; videos: number };
  chat: { total: number; today: number; errorsToday: number; successRate: string };
  telegram: { interactions: number };
  recentUsers: UserRow[];
  chatsByDay: { date: string; count: string }[];
};

type UserRow = {
  id: string; email: string; name: string | null; createdAt: string;
  userProfile: { plan: string } | null;
  _count: { uploadedDocuments: number; courses: number; chatMessages: number };
};

const PLAN_CONFIG: Record<string, { label: string; textColor: string; bg: string; border: string; bar: string; icon: any }> = {
  libre:      { label: "Libre",      textColor: "text-slate-400",    bg: "bg-slate-400/10",    border: "border-slate-400/20",    bar: "bg-slate-400",    icon: Leaf },
  croissance: { label: "Croissance", textColor: "text-[#0F6E56]",    bg: "bg-[#E1F5EE]",       border: "border-[#0F6E56]/20",    bar: "bg-[#0F6E56]",    icon: TrendingUp },
  autopilote: { label: "Autopilote", textColor: "text-[#7F77DD]",    bg: "bg-[#7F77DD]/10",    border: "border-[#7F77DD]/20",    bar: "bg-[#7F77DD]",    icon: Crown },
};

function PlanBadge({ plan }: { plan?: string }) {
  const cfg = PLAN_CONFIG[plan || "libre"] || PLAN_CONFIG.libre;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", cfg.textColor, cfg.bg, cfg.border)}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: any; label: string; value: any; sub?: string; accent: string;
}) {
  return (
    <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-5 flex items-start gap-4">
      <div className={cn("p-3 rounded-xl flex-shrink-0", accent)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)] mt-0.5">{value ?? "—"}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: { date: string; count: string }[] }) {
  if (!data?.length) return <p className="text-xs text-[var(--text-muted)]">No data yet</p>;
  const max = Math.max(...data.map(d => parseInt(d.count) || 0));
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full bg-[#0F6E56] rounded-t opacity-70 hover:opacity-100 transition-opacity"
            style={{ height: `${max > 0 ? (parseInt(d.count) / max) * 52 : 4}px`, minHeight: "4px" }}
            title={`${d.date}: ${d.count} chats`}
          />
          <span className="text-[9px] text-[var(--text-muted)]">
            {new Date(d.date).toLocaleDateString("fr-FR", { weekday: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}

function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Delete ${email}? This is irreversible.`)) return;
    setDeleting(userId);
    await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
    setDeleting(null);
    fetchUsers();
  };

  const handlePlanChange = async (userId: string, plan: string) => {
    setChanging(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan }),
    });
    setChanging(null);
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search email or name…"
            className="pl-9 pr-4 py-2 bg-[var(--bg-surface-2)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#0F6E56] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-64"
          />
        </div>
        <span className="text-xs text-[var(--text-muted)] font-medium">{total} users total</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-surface-2)] text-[var(--text-muted)] text-xs uppercase tracking-wider">
            <tr>
              {["User", "Plan", "Docs", "Courses", "Chats", "Joined", "Actions"].map(h => (
                <th key={h} className={cn("px-4 py-3", ["User","Plan","Joined"].includes(h) ? "text-left" : "text-center")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--text-muted)] text-sm">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[var(--text-muted)] text-sm">No users found</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-[var(--bg-surface-2)] transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--text-primary)] truncate max-w-[140px]">{u.name || "—"}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate max-w-[140px]">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.userProfile?.plan || "libre"}
                    onChange={e => handlePlanChange(u.id, e.target.value)}
                    disabled={changing === u.id}
                    className="bg-transparent border border-[var(--border-color)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#0F6E56] cursor-pointer"
                  >
                    <option value="libre">Libre</option>
                    <option value="croissance">Croissance</option>
                    <option value="autopilote">Autopilote</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs text-[var(--text-muted)]">{u._count.uploadedDocuments}</td>
                <td className="px-4 py-3 text-center font-mono text-xs text-[var(--text-muted)]">{u._count.courses}</td>
                <td className="px-4 py-3 text-center font-mono text-xs text-[var(--text-muted)]">{u._count.chatMessages}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleDelete(u.id, u.email)}
                    disabled={deleting === u.id}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded-lg border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-surface-2)] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-[var(--text-muted)]">Page {page} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="p-1.5 rounded-lg border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--bg-surface-2)] transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "users" | "ai">("overview");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) setStats(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const tabs = [
    { id: "overview", label: "Overview",   icon: BarChart3 },
    { id: "users",    label: "Users",       icon: Users },
    { id: "ai",       label: "AI Monitor",  icon: Bot },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0F6E56]" /> Admin Dashboard
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Growvia platform management</p>
        </div>
        <button onClick={fetchStats} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface-2)] hover:bg-[#E1F5EE] dark:hover:bg-[rgba(15,110,86,0.15)] border border-[var(--border-color)] hover:border-[#0F6E56]/30 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[#0F6E56] transition-all">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-surface-2)] p-1 rounded-xl w-fit border border-[var(--border-color)]">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-[var(--bg-sidebar)] text-[#0F6E56] shadow-sm border border-[var(--border-color)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}>
              <Icon className={cn("w-4 h-4", active && "text-[#0F6E56]")} />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users}         label="Total Users"   value={stats?.users.total}           sub={`+${stats?.users.today ?? 0} today · +${stats?.users.last7 ?? 0} this week`} accent="bg-[#E1F5EE] dark:bg-[rgba(15,110,86,0.15)] text-[#0F6E56]" />
            <StatCard icon={FileText}      label="Documents"     value={stats?.content.documents}     sub={`${stats?.content.courses ?? 0} courses · ${stats?.content.videos ?? 0} videos`} accent="bg-[#7F77DD]/10 text-[#7F77DD]" />
            <StatCard icon={MessageSquare} label="Chat Messages" value={stats?.chat.total}            sub={`${stats?.chat.today ?? 0} today`} accent="bg-[#5DCAA5]/10 text-[#5DCAA5]" />
            <StatCard icon={Send}          label="Telegram"      value={stats?.telegram.interactions} sub="total interactions" accent="bg-sky-500/10 text-sky-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plans */}
            <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0F6E56]" /> Plans Distribution
              </h3>
              {stats && Object.entries(PLAN_CONFIG).map(([key, cfg]) => {
                const count = stats.users.plans[key] || 0;
                const pct = stats.users.total > 0 ? (count / stats.users.total) * 100 : 0;
                const Icon = cfg.icon;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className={cn("font-medium flex items-center gap-1.5", cfg.textColor)}>
                        <Icon className="w-3.5 h-3.5" />{cfg.label}
                      </span>
                      <span className="text-[var(--text-muted)]">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", cfg.bar)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#5DCAA5]" /> Chat Activity (7 days)
              </h3>
              <MiniBarChart data={stats?.chatsByDay || []} />
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border-color)] text-center">
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{stats?.chat.today ?? 0}</p>
                  <p className="text-xs text-[var(--text-muted)]">Today</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#0F6E56]">{stats?.chat.successRate ?? 100}%</p>
                  <p className="text-xs text-[var(--text-muted)]">Success rate</p>
                </div>
                <div>
                  <p className={cn("text-lg font-bold", (stats?.chat.errorsToday ?? 0) > 0 ? "text-red-400" : "text-[#0F6E56]")}>
                    {stats?.chat.errorsToday ?? 0}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Errors today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent signups */}
          <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0F6E56]" /> Recent Signups
            </h3>
            {(stats?.recentUsers || []).map(u => (
              <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border-color)] last:border-0">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{u.name || u.email}</p>
                  <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <PlanBadge plan={u.userProfile?.plan} />
                  <span className="text-xs text-[var(--text-muted)]">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── USERS ── */}
      {tab === "users" && (
        <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0F6E56]" /> User Management
          </h3>
          <UsersTable />
        </div>
      )}

      {/* ── AI MONITOR ── */}
      {tab === "ai" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-[#0F6E56]" />
                <h3 className="font-bold text-[var(--text-primary)]">RAG Success Rate</h3>
              </div>
              <p className="text-4xl font-bold text-[#0F6E56]">{stats?.chat.successRate ?? 100}%</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{stats?.chat.today ?? 0} questions today · {stats?.chat.errorsToday ?? 0} fallbacks</p>
            </div>
            <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-[#7F77DD]" />
                <h3 className="font-bold text-[var(--text-primary)]">Pinecone Index</h3>
              </div>
              <p className="text-4xl font-bold text-[#7F77DD]">{stats?.content.documents ?? 0}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">documents indexed · school-knowledge</p>
            </div>
            <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-[var(--text-primary)]">Errors Today</h3>
              </div>
              <p className={cn("text-4xl font-bold", (stats?.chat.errorsToday ?? 0) > 0 ? "text-red-400" : "text-[#0F6E56]")}>
                {stats?.chat.errorsToday ?? 0}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">LLM fallbacks triggered</p>
            </div>
          </div>

          {/* AI Pipeline */}
          <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#7F77DD]" /> AI Pipeline Status
            </h3>
            <div className="space-y-2">
              {[
                { n: "1", label: "User Question",  desc: "/api/pdf-chat receives request",             color: "bg-[#E1F5EE] dark:bg-[rgba(15,110,86,0.15)] text-[#0F6E56]" },
                { n: "2", label: "n8n Webhook",    desc: "pdf-agent workflow — 20s timeout",           color: "bg-[#E1F5EE] dark:bg-[rgba(15,110,86,0.15)] text-[#0F6E56]" },
                { n: "3", label: "Pinecone RAG",   desc: "Gemini embedding-001 → vector search",       color: "bg-[#7F77DD]/10 text-[#7F77DD]" },
                { n: "4", label: "LLM Fallback",   desc: "OpenRouter cascade — 4 free models",         color: "bg-[#7F77DD]/10 text-[#7F77DD]" },
                { n: "5", label: "Response",       desc: "Saved to DB · returned to user",             color: "bg-[#5DCAA5]/10 text-[#5DCAA5]" },
              ].map(s => (
                <div key={s.n} className="flex items-center gap-4 p-3 bg-[var(--bg-surface-2)] rounded-xl">
                  <div className={cn("w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0", s.color)}>{s.n}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{s.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{s.desc}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#5DCAA5] flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Quiz models */}
          <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#5DCAA5]" /> Quiz Generator — Fallback Models
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { model: "google/gemma-4-31b-it:free",        priority: "1st" },
                { model: "openai/gpt-oss-120b:free",          priority: "2nd" },
                { model: "moonshotai/kimi-k2.6:free",         priority: "3rd" },
                { model: "nvidia/nemotron-3-super-120b:free", priority: "4th" },
              ].map(m => (
                <div key={m.model} className="flex items-center gap-3 p-3 bg-[var(--bg-surface-2)] rounded-xl border border-[var(--border-color)]">
                  <span className="text-xs font-bold text-[#0F6E56] w-8 flex-shrink-0">{m.priority}</span>
                  <span className="text-xs font-mono text-[var(--text-secondary)] truncate">{m.model}</span>
                  <div className="w-2 h-2 rounded-full bg-[#5DCAA5] flex-shrink-0 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
