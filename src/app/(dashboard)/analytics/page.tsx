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
        throw new Error(data.error || "An error occurred during analysis.");
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
        <h2 className="text-3xl font-bold tracking-tight">New Analysis</h2>
        <p className="text-muted-foreground mt-2">
          Analyze an Instagram account to extract business insights.
        </p>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle>Run an analysis</CardTitle>
          <CardDescription>
            Enter the Instagram username to analyze. Our AI via n8n will process recent comments.
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
              {loading ? "Analyzing..." : "Analyze"}
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
              <AlertTitle>Error</AlertTitle>
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
            <p className="text-muted-foreground animate-pulse">n8n AI is analyzing the data, please wait...</p>
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
              title="Global Sentiment" 
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
              title="Client Needs" 
              icon={HeartHandshake} 
              items={result.besoinsClients} 
              delay={0.3} 
            />
            <AnalysisCard 
              title="Business Opportunities" 
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
