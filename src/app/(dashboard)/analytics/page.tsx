"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Loader2, AtSign, Target, Users, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AnalyticsPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    instagram_handle: "",
    niche: "",
    main_offer: "",
    price_range: "",
    target_audience: "",
    main_goal: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.instagram_handle) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),  // no plan change
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error during audit");
      // Force full reload so new JWT cookie takes effect
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#0F6E56]/10 flex items-center justify-center mx-auto mb-4">
          <AtSign className="w-7 h-7 text-[#0F6E56]" />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)]">AtSign Audit</h1>
        <p className="text-[var(--text-secondary)]">
          Our AI will analyze your profile and generate a 90-day growth plan.
        </p>
      </div>

      <Card className="border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Your Profile Info</CardTitle>
          <CardDescription>Fill in the details so the AI can generate a personalized plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">AtSign Username *</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
              <Input
                name="instagram_handle"
                placeholder="@yourusername"
                value={form.instagram_handle}
                onChange={handleChange}
                className="pl-9"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Niche</label>
              <Input name="niche" placeholder="e.g. fitness, coaching..." value={form.niche} onChange={handleChange} disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Main Offer</label>
              <Input name="main_offer" placeholder="e.g. online course, 1:1 coaching..." value={form.main_offer} onChange={handleChange} disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Price Range</label>
              <Input name="price_range" placeholder="e.g. $100-$500" value={form.price_range} onChange={handleChange} disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">Target Audience</label>
              <Input name="target_audience" placeholder="e.g. women 25-35" value={form.target_audience} onChange={handleChange} disabled={loading} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Main Goal</label>
            <Input name="main_goal" placeholder="e.g. get more clients, grow followers..." value={form.main_goal} onChange={handleChange} disabled={loading} />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <Button
            className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white rounded-lg gap-2 h-11"
            onClick={handleSubmit}
            disabled={loading || !form.instagram_handle}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating your audit... (1-2 min)</>
            ) : (
              <><Zap className="w-4 h-4" /> Run AI Audit</>
            )}
          </Button>

          {loading && (
            <p className="text-xs text-center text-[var(--text-muted)]">
              Our AI is analyzing your profile and building your 90-day plan. Please wait...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
