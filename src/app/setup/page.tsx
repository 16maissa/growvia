"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, Compass, Bot, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PlanChoice = "libre" | "croissance" | "autopilote" | null;

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [plan, setPlan] = useState<PlanChoice>(null);
  
  // Form State
  const [instagramHandle, setInstagramHandle] = useState("");
  const [niche, setNiche] = useState("");
  const [mainOffer, setMainOffer] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mainGoal, setMainGoal] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handlePlanSelection = async (selectedPlan: PlanChoice) => {
    setPlan(selectedPlan);
    if (selectedPlan === "libre") {
      setIsLoading(true);
      try {
        const res = await fetch("/api/automation/mode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "libre", mode: "libre" }),
        });
        if (res.ok) {
          router.push("/dashboard/tools");
        } else {
          setError("Error configuring the plan");
          setIsLoading(false);
        }
      } catch (e) {
        setError("Network error");
        setIsLoading(false);
      }
    } else {
      setStep(2);
    }
  };

  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLoadingText("Analyzing your profile...");

    try {
      // Simulate progression texts
      const texts = ["Calculating metrics...", "Detecting errors...", "Generating 90-day plan..."];
      let i = 0;
      const interval = setInterval(() => {
        if (i < texts.length) {
          setLoadingText(texts[i]);
          i++;
        }
      }, 3000);

      const res = await fetch("/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
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

      if (!res.ok) {
        throw new Error(data.error || "An error occurred during the audit.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isLoading && step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-page)] p-4 transition-colors duration-200">
        <div className="relative">
          <div className="absolute inset-0 bg-[#0F6E56]/20 blur-xl rounded-full animate-pulse"></div>
          <Bot className="w-16 h-16 text-[#0F6E56] animate-bounce relative z-10" />
        </div>
        <h2 className="mt-8 text-2xl font-bold text-[#0F6E56]">
          {loadingText}
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">Please wait, our AI agents are working...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] p-4 relative overflow-hidden transition-colors duration-200">
      <div className="w-full max-w-4xl z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-4 text-[var(--text-primary)]">How do you want to use growvia?</h1>
                <p className="text-xl text-[var(--text-secondary)]">Choose the mode that best fits your needs.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-[var(--border-color)] hover:border-[#0F6E56]/50 cursor-pointer transition-all hover:shadow-lg bg-[var(--bg-surface)] rounded-xl" onClick={() => handlePlanSelection("libre")}>
                  <CardHeader>
                    <Zap className="w-10 h-10 text-amber-500 mb-4" />
                    <CardTitle className="text-[var(--text-primary)]">Free Mode</CardTitle>
                    <CardDescription className="text-[var(--text-secondary)]">I just want to use AI tools occasionally.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-[#0F6E56]" /> Standalone tools</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-[#0F6E56]" /> No full audit</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-[#0F6E56]" /> 5 free generations</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-[var(--border-color)] hover:border-[#0F6E56] cursor-pointer transition-all hover:shadow-xl bg-[var(--bg-surface)] relative overflow-hidden rounded-xl" onClick={() => handlePlanSelection("croissance")}>
                  <div className="absolute top-0 right-0 bg-[#0F6E56] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">Recommended</div>
                  <CardHeader>
                    <Compass className="w-10 h-10 text-[#0F6E56] mb-4" />
                    <CardTitle className="text-[var(--text-primary)]">Growth Plan</CardTitle>
                    <CardDescription className="text-[var(--text-secondary)]">I want an audit and step-by-step guidance.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-[#0F6E56]" /> Deep audit</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-[#0F6E56]" /> 90-day action plan</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-[#0F6E56]" /> Manual publishing</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-[var(--border-color)] hover:border-[#7F77DD]/50 cursor-pointer transition-all hover:shadow-lg bg-[var(--bg-surface)] rounded-xl" onClick={() => handlePlanSelection("autopilote")}>
                  <CardHeader>
                    <Bot className="w-10 h-10 text-[#7F77DD] mb-4" />
                    <CardTitle className="text-[var(--text-primary)]">Autopilot Plan</CardTitle>
                    <CardDescription className="text-[var(--text-secondary)]">I want AI to handle everything (after validation).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-[#0F6E56]" /> Autonomous agents</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-[#0F6E56]" /> One-click validation</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-[#0F6E56]" /> Full automation (after 14 days)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-[var(--bg-surface)] border-[var(--border-color)] shadow-2xl rounded-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-[var(--text-primary)]">Audit Configuration</CardTitle>
                  <CardDescription className="text-[var(--text-secondary)]">To create your 90-day plan, our AI needs to understand your context.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitAudit}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="handle">Instagram Handle</Label>
                        <Input id="handle" placeholder="@myaccount" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} required className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="niche">Main Niche</Label>
                        <Input id="niche" placeholder="e.g., Fitness, Business, Tech..." value={niche} onChange={(e) => setNiche(e.target.value)} required className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="offer">Main Offer (What do you sell?)</Label>
                      <Input id="offer" placeholder="3-month fitness coaching" value={mainOffer} onChange={(e) => setMainOffer(e.target.value)} required className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price Range (€)</Label>
                        <Input id="price" placeholder="€500 - €1500" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} required className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goal">Main Goal</Label>
                        <Input id="goal" placeholder="Generate more qualified leads" value={mainGoal} onChange={(e) => setMainGoal(e.target.value)} required className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="audience">Target Audience (Who buys?)</Label>
                      <Input id="audience" placeholder="Men 25-40, executives..." value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} required className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]" />
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] rounded-md border border-[var(--color-danger-main)]/20">{error}</div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)} className="hover:bg-[var(--bg-surface-2)]">Back</Button>
                    <Button type="submit" className="bg-[#0F6E56] hover:bg-[#085041] text-white">Launch Deep Audit</Button>
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
