"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Zap, CheckCircle2, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "choose" | "semi-auto-form" | "loading";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [loadingText, setLoadingText] = useState("Analyzing your profile...");
  const [error, setError] = useState<string | null>(null);

  // Semi-auto form fields
  const [instagramHandle, setInstagramHandle] = useState("");
  const [niche, setNiche] = useState("");
  const [mainOffer, setMainOffer] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mainGoal, setMainGoal] = useState("");

  // ── FREE PLAN ──────────────────────────────────────────────
  const handleFreePlan = async () => {
    try {
      const res = await fetch("/api/automation/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "libre", mode: "libre" }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Error configuring the plan. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
  };

  // ── SEMI-AUTO AUDIT ────────────────────────────────────────
  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("loading");
    setLoadingText("Analyzing your profile...");
    setError(null);

    const texts = [
      "Calculating your metrics...",
      "Detecting errors & opportunities...",
      "Generating your 90-day plan...",
      "Almost done...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < texts.length) setLoadingText(texts[i++]);
    }, 3000);

    try {
      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "semi-auto",
          instagram_handle: instagramHandle,
          niche,
          main_offer: mainOffer,
          price_range: priceRange,
          target_audience: targetAudience,
          main_goal: mainGoal,
        }),
      });

      clearInterval(interval);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Audit failed. Please try again.");

      router.push("/dashboard");
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message);
      setStep("semi-auto-form");
    }
  };

  // ── LOADING SCREEN ─────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-page)] p-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#0F6E56]/20 blur-xl rounded-full animate-pulse" />
          <Bot className="w-16 h-16 text-[#0F6E56] animate-bounce relative z-10" />
        </div>
        <h2 className="text-2xl font-bold text-[#0F6E56] mb-2">{loadingText}</h2>
        <p className="text-[var(--text-secondary)]">Our AI agents are working on your profile…</p>
        <div className="mt-6 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#0F6E56] animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] p-4 overflow-hidden">
      {/* Growvia logo top */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
        <div className="flex items-center justify-center w-8 h-8 rounded-[8px] bg-[#0F6E56]">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 17 C4 17 6 10 12 10 C18 10 20 4 20 4" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 4 L16 4 M20 4 L20 8" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="17" r="2.5" fill="#5DCAA5"/>
          </svg>
        </div>
        <span className="text-lg font-medium tracking-tight">
          <span className="text-[var(--text-primary)]">grow</span>
          <span className="text-[#0F6E56]">via</span>
        </span>
      </div>

      <div className="w-full max-w-4xl z-10">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: CHOOSE PLAN ── */}
          {step === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-3 text-[var(--text-primary)]">
                  How do you want to use Growvia?
                </h1>
                <p className="text-lg text-[var(--text-secondary)]">
                  Choose the plan that fits your goals.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* FREE PLAN */}
                <Card
                  onClick={handleFreePlan}
                  className="border-[var(--border-color)] hover:border-amber-400/60 cursor-pointer transition-all hover:shadow-lg bg-[var(--bg-surface)] rounded-2xl group"
                >
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-amber-500" />
                    </div>
                    <CardTitle className="text-xl text-[var(--text-primary)]">Free</CardTitle>
                    <CardDescription className="text-[var(--text-secondary)]">
                      Pay-as-you-go. Use AI tools whenever you need, no commitment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Access all AI tools</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> 5 free generations included</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Quick profile analysis on demand</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> No subscription required</div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex items-center justify-between text-amber-500 font-medium group-hover:gap-3 transition-all">
                      <span>Get started free</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardFooter>
                </Card>

                {/* SEMI-AUTO PLAN */}
                <Card
                  onClick={() => setStep("semi-auto-form")}
                  className="border-[#0F6E56]/40 hover:border-[#0F6E56] cursor-pointer transition-all hover:shadow-xl bg-[var(--bg-surface)] rounded-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 bg-[#0F6E56] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                    Recommended
                  </div>
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center mb-4">
                      <Bot className="w-6 h-6 text-[#0F6E56]" />
                    </div>
                    <CardTitle className="text-xl text-[var(--text-primary)]">Semi-Auto</CardTitle>
                    <CardDescription className="text-[var(--text-secondary)]">
                      Deep audit + 90-day AI-powered action plan tailored to your account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F6E56] shrink-0" /> Deep Instagram audit</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F6E56] shrink-0" /> Personalized 90-day action plan</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F6E56] shrink-0" /> AI content generation per task</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0F6E56] shrink-0" /> Full overview, errors & stats</div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex items-center justify-between text-[#0F6E56] font-medium group-hover:gap-3 transition-all">
                      <span>Start my audit</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {error && (
                <div className="mt-6 max-w-md mx-auto p-3 text-sm text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] rounded-md border border-[var(--color-danger-main)]/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--color-danger-main)] shrink-0" />
                  {error}
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: SEMI-AUTO FORM ── */}
          {step === "semi-auto-form" && (
            <motion.div
              key="semi-auto-form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-[var(--bg-surface)] border-[var(--border-color)] shadow-2xl rounded-2xl">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-[#0F6E56]" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-[var(--text-primary)]">Semi-Auto Setup</CardTitle>
                      <CardDescription className="text-[var(--text-secondary)]">
                        Tell us about your account so our AI can build your personalized plan.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <form onSubmit={handleSubmitAudit}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="handle">Instagram Handle</Label>
                        <Input
                          id="handle"
                          placeholder="@yourhandle"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                          required
                          className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="niche">Your Niche</Label>
                        <Input
                          id="niche"
                          placeholder="e.g. Fitness, Business, Tech…"
                          value={niche}
                          onChange={(e) => setNiche(e.target.value)}
                          required
                          className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offer">Main Offer (What do you sell?)</Label>
                      <Input
                        id="offer"
                        placeholder="e.g. 3-month fitness coaching"
                        value={mainOffer}
                        onChange={(e) => setMainOffer(e.target.value)}
                        required
                        className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price Range ($)</Label>
                        <Input
                          id="price"
                          placeholder="e.g. $500 – $1500"
                          value={priceRange}
                          onChange={(e) => setPriceRange(e.target.value)}
                          required
                          className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goal">Main Goal</Label>
                        <Input
                          id="goal"
                          placeholder="e.g. More qualified leads"
                          value={mainGoal}
                          onChange={(e) => setMainGoal(e.target.value)}
                          required
                          className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="audience">Target Audience (Who buys?)</Label>
                      <Input
                        id="audience"
                        placeholder="e.g. Men 25-40, executives…"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        required
                        className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]"
                      />
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] rounded-md border border-[var(--color-danger-main)]/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[var(--color-danger-main)] shrink-0" />
                        {error}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setStep("choose"); setError(null); }}
                      className="hover:bg-[var(--bg-surface-2)]"
                    >
                      ← Back
                    </Button>
                    <Button type="submit" className="bg-[#0F6E56] hover:bg-[#085041] text-white px-6">
                      Launch Deep Audit
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
