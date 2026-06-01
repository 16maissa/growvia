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
          setError("Erreur lors de la configuration du plan");
          setIsLoading(false);
        }
      } catch (e) {
        setError("Erreur réseau");
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
    setLoadingText("Analyse de votre profil en cours...");

    try {
      // Simulate progression texts
      const texts = ["Calcul des métriques...", "Détection des erreurs...", "Génération du plan 90 jours..."];
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
        throw new Error(data.error || "Une erreur est survenue lors de l'audit.");
      }

      router.push(`/dashboard/audit/${data.auditId}`);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isLoading && step === 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <Bot className="w-16 h-16 text-primary animate-bounce relative z-10" />
        </div>
        <h2 className="mt-8 text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          {loadingText}
        </h2>
        <p className="text-muted-foreground mt-2">Veuillez patienter, nos agents IA travaillent...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
      
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
                <h1 className="text-4xl font-bold mb-4">Comment souhaitez-vous utiliser InstaAnalyzer ?</h1>
                <p className="text-xl text-muted-foreground">Choisissez le mode qui correspond le mieux à vos besoins.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5 bg-card/50 backdrop-blur-sm" onClick={() => handlePlanSelection("libre")}>
                  <CardHeader>
                    <Zap className="w-10 h-10 text-yellow-500 mb-4" />
                    <CardTitle>Mode Libre</CardTitle>
                    <CardDescription>Je veux juste utiliser les outils IA ponctuellement.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Outils standalone</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Pas d'audit complet</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> 5 générations gratuites</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border hover:border-primary cursor-pointer transition-all hover:shadow-xl hover:shadow-primary/10 bg-card/50 backdrop-blur-sm relative overflow-hidden" onClick={() => handlePlanSelection("croissance")}>
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">Recommandé</div>
                  <CardHeader>
                    <Compass className="w-10 h-10 text-primary mb-4" />
                    <CardTitle>Plan Croissance</CardTitle>
                    <CardDescription>Je veux un audit et être guidé pas à pas.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Audit profond</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Plan d'action 90J</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Publication manuelle</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border hover:border-purple-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/10 bg-card/50 backdrop-blur-sm" onClick={() => handlePlanSelection("autopilote")}>
                  <CardHeader>
                    <Bot className="w-10 h-10 text-purple-500 mb-4" />
                    <CardTitle>Plan Autopilote</CardTitle>
                    <CardDescription>Je veux que l'IA gère tout (après validation).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Agents autonomes</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Validation en 1 clic</li>
                      <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Full automation (après 14J)</li>
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
              <Card className="bg-card/60 backdrop-blur-xl border-primary/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Paramétrage de l'Audit</CardTitle>
                  <CardDescription>Pour créer votre plan 90 jours, notre IA a besoin de connaître votre contexte.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmitAudit}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="handle">Pseudo Instagram</Label>
                        <Input id="handle" placeholder="@moncompte" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="niche">Niche principale</Label>
                        <Input id="niche" placeholder="ex: Fitness, Business, Tech..." value={niche} onChange={(e) => setNiche(e.target.value)} required />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="offer">Offre principale (Qu'est-ce que vous vendez ?)</Label>
                      <Input id="offer" placeholder="Coaching sportif 3 mois" value={mainOffer} onChange={(e) => setMainOffer(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Fourchette de prix (€)</Label>
                        <Input id="price" placeholder="500€ - 1500€" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goal">Objectif principal</Label>
                        <Input id="goal" placeholder="Générer plus de leads qualifiés" value={mainGoal} onChange={(e) => setMainGoal(e.target.value)} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="audience">Audience cible (Qui achète ?)</Label>
                      <Input id="audience" placeholder="Hommes 25-40 ans, cadres..." value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} required />
                    </div>

                    {error && (
                      <div className="p-3 text-sm text-rose-500 bg-rose-500/10 rounded-md border border-rose-500/20">{error}</div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>Retour</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground">Lancer l'Audit Profond</Button>
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
