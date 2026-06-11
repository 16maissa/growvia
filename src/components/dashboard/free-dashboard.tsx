"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Activity, Eye, Bookmark, TrendingUp, Video, ExternalLink,
  ArrowRight, BarChart2, AlertTriangle, Bot, Loader2, AlertCircle,
  Users, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Metrics {
  engagement_rate?: number;
  reach_ratio?: number;
  save_rate?: number;
  posting_frequency?: string;
  reel_ratio?: number;
  bio_clicks?: number;
}

interface Props {
  user: {
    name: string;
    userProfile?: { instagram_handle?: string | null } | null;
    audits?: Array<{
      score?: number | null;
      metrics_json?: any;
      audience_json?: any;
      profile_json?: any;
      createdAt: string;
    }> | null;
  };
}

function MetricCard({ icon: Icon, label, value, sub, highlight }: any) {
  return (
    <div className="relative bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-4 flex items-center gap-4 hover:border-[#0F6E56]/30 transition-colors">
      {highlight !== undefined && (
        <span className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${highlight ? "bg-[#1D9E75]" : "bg-[#E24B4A]"}`} />
      )}
      <div className="p-2 rounded-lg bg-[#0F6E56]/10 shrink-0">
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

export function FreeDashboard({ user }: Props) {
  const router = useRouter();
  const lastAudit = user.audits?.[0] ?? null;
  const hasAudit = !!lastAudit;

  const metrics: Metrics = (lastAudit?.metrics_json as Metrics) ?? {};
  const profile: any = lastAudit?.profile_json ?? {};

  const engagementData = useMemo(() => [
    { name: "Before",   value: Math.max((metrics.engagement_rate ?? 2) - 1.5, 0.5) },
    { name: "Current",  value: metrics.engagement_rate ?? 2 },
    { name: "+30d",     value: (metrics.engagement_rate ?? 2) + 0.8 },
    { name: "+60d",     value: (metrics.engagement_rate ?? 2) + 2 },
    { name: "+90d",     value: (metrics.engagement_rate ?? 2) + 3.5 },
  ], [metrics.engagement_rate]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-1">
          Welcome, {user.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-[var(--text-secondary)]">
          You're on the <span className="font-semibold text-amber-500">Free</span> plan — pay-as-you-go.
        </p>
      </div>

      {/* CTA banner — si pas d'audit */}
      {!hasAudit && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-[#0F6E56]/30 bg-[#0F6E56]/5 rounded-2xl">
            <CardContent className="py-6 px-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-5 h-5 text-[#0F6E56]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Start your Instagram analysis</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                      Our AI will scan your profile and show your key stats & overview in seconds.
                    </p>
                  </div>
                </div>
                <Button
                  className="bg-[#0F6E56] hover:bg-[#085041] text-white rounded-lg shrink-0"
                  onClick={() => router.push("/analytics")}
                >
                  Run analysis <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid — vide si pas d'audit, rempli sinon */}
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard
            icon={Activity}
            label="Engagement Rate"
            value={metrics.engagement_rate != null ? `${metrics.engagement_rate}%` : null}
            sub={hasAudit ? "Target: > 3%" : "Run an analysis to see your stats"}
            highlight={metrics.engagement_rate != null ? metrics.engagement_rate > 3 : undefined}
          />
          <MetricCard
            icon={Eye}
            label="Reach Ratio"
            value={metrics.reach_ratio != null ? `${metrics.reach_ratio}%` : null}
            sub={!hasAudit ? "No data yet" : undefined}
          />
          <MetricCard
            icon={Bookmark}
            label="Save Rate"
            value={metrics.save_rate != null ? `${metrics.save_rate}%` : null}
            sub={!hasAudit ? "No data yet" : undefined}
          />
          <MetricCard
            icon={TrendingUp}
            label="Post Frequency"
            value={metrics.posting_frequency ?? null}
            sub={!hasAudit ? "No data yet" : undefined}
          />
          <MetricCard
            icon={Video}
            label="Reel Share"
            value={metrics.reel_ratio != null ? `${(metrics.reel_ratio * 100).toFixed(0)}%` : null}
            sub={!hasAudit ? "No data yet" : undefined}
          />
          <MetricCard
            icon={ExternalLink}
            label="Bio Clicks (30D)"
            value={metrics.bio_clicks ?? null}
            sub={!hasAudit ? "No data yet" : undefined}
          />
        </div>
      </div>

      {/* Overview — score + profile si audit dispo */}
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Overview</h2>
        {!hasAudit ? (
          <Card className="border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl">
            <CardContent className="py-12 text-center text-[var(--text-secondary)]">
              <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No analysis yet</p>
              <p className="text-sm mt-1">Run a quick analysis to see your overview here.</p>
              <Button
                className="mt-4 bg-[#0F6E56] hover:bg-[#085041] text-white rounded-lg"
                onClick={() => router.push("/analytics")}
              >
                Run analysis <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Score + Profile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="flex items-center justify-center py-6 bg-gradient-to-br from-[#0F6E56]/5 to-purple-500/5 border-[#0F6E56]/20">
                <div className="text-center space-y-2">
                  <p className="text-5xl font-black text-[#0F6E56]">{lastAudit.score ?? "—"}</p>
                  <p className="text-xs text-[var(--text-muted)]">Audit Score / 100</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {new Date(lastAudit.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long" })}
                  </p>
                </div>
              </Card>

              <Card className="md:col-span-2 bg-[var(--bg-surface)]/40">
                <CardHeader><CardTitle className="text-base">Instagram Profile</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-[var(--bg-base)]/60 rounded-lg">
                    <p className="text-2xl font-black text-[var(--text-primary)]">{profile.followers?.toLocaleString("en-US") ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)]">Followers</p>
                  </div>
                  <div className="text-center p-3 bg-[var(--bg-base)]/60 rounded-lg">
                    <p className="text-2xl font-black text-[var(--text-primary)]">{profile.following?.toLocaleString("en-US") ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)]">Following</p>
                  </div>
                  <div className="text-center p-3 bg-[var(--bg-base)]/60 rounded-lg">
                    <p className="text-2xl font-black text-[var(--text-primary)]">{profile.posts_count ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)]">Posts</p>
                  </div>
                  <div className="text-center p-3 bg-[var(--bg-base)]/60 rounded-lg">
                    <p className={`text-2xl font-black ${metrics.engagement_rate && metrics.engagement_rate > 3 ? "text-emerald-500" : "text-yellow-500"}`}>
                      {metrics.engagement_rate != null ? `${metrics.engagement_rate}%` : "—"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Engagement</p>
                  </div>
                  {profile.full_name && (
                    <div className="col-span-full sm:col-span-2 p-3 bg-[var(--bg-base)]/60 rounded-lg">
                      <p className="text-xs font-bold text-[var(--text-primary)] mb-1">{profile.full_name}</p>
                      {profile.biography && <p className="text-xs text-[var(--text-muted)] line-clamp-2">{profile.biography}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Engagement projection */}
            <Card>
              <CardHeader><CardTitle className="text-base">Engagement Projection</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => `${v}%`} />
                    <ReferenceLine y={3} stroke="#10b981" strokeDasharray="4 4"
                      label={{ value: "Target 3%", fill: "#10b981", fontSize: 11 }} />
                    <Line type="monotone" dataKey="value" stroke="#0F6E56" strokeWidth={2.5}
                      dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Upgrade banner */}
      <Card className="border-[#0F6E56]/20 bg-gradient-to-r from-[#0F6E56]/5 to-transparent rounded-2xl">
        <CardContent className="py-6 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-[#0F6E56]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Unlock Semi-Auto</p>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5 max-w-md">
                Get a deep 90-day AI plan, full error detection, and one-click content generation for every task.
              </p>
            </div>
          </div>
          <Button
            className="bg-[#0F6E56] hover:bg-[#085041] text-white rounded-lg shrink-0"
            onClick={() => router.push("/pricing")}
          >
            Upgrade to Semi-Auto <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
