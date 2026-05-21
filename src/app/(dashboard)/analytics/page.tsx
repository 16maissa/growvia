"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnalysisCard } from "@/components/analytics/analysis-card";
import { Spinner } from "@/components/ui/spinner";
import { Search, Activity, AlertTriangle, Lightbulb, HeartHandshake, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AnalysisResult {
  id: string;
  instagramUsername: string;
  sentimentGlobal: string;
  frustrations: string[];
  besoinsClients: string[];
  opportunitesBusiness: string[];
}

export default function AnalyticsPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze-instagram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'analyse.");
      }

      setResult(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nouvelle Analyse</h2>
        <p className="text-muted-foreground mt-2">
          Analysez un compte Instagram pour en extraire des insights business.
        </p>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle>Lancer une analyse</CardTitle>
          <CardDescription>
            Entrez le nom d'utilisateur Instagram que vous souhaitez analyser. Notre IA via n8n va traiter les commentaires récents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9 border-border bg-background focus-visible:ring-primary"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !username} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]">
              {loading ? <Spinner size={18} className="mr-2 text-white" /> : null}
              {loading ? "Analyse..." : "Analyser"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 space-y-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <Spinner size={48} />
            </div>
            <p className="text-muted-foreground animate-pulse">L'IA de n8n analyse les données, veuillez patienter...</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="results"
            className="grid gap-6 md:grid-cols-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnalysisCard 
              title="Sentiment Global" 
              icon={Activity} 
              items={[result.sentimentGlobal]} 
              delay={0.1}
            />
            <AnalysisCard 
              title="Frustrations" 
              icon={AlertTriangle} 
              items={result.frustrations} 
              delay={0.2} 
              badgeColor="destructive"
            />
            <AnalysisCard 
              title="Besoins Clients" 
              icon={HeartHandshake} 
              items={result.besoinsClients} 
              delay={0.3} 
            />
            <AnalysisCard 
              title="Opportunités Business" 
              icon={Lightbulb} 
              items={result.opportunitesBusiness} 
              delay={0.4} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
