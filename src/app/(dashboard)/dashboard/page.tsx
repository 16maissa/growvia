import { KpiCard } from "@/components/dashboard/kpi-card";
import { SentimentChart } from "@/components/dashboard/sentiment-chart";
import { prisma } from "@/lib/prisma";
import { Activity, Smile, Frown, Meh, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const analyses = await prisma.analysis.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // @ts-ignore - L'erreur rouge est due au cache de VS Code.
  const imageGenerationsCount = await prisma.imageGeneration.count();

  const total = analyses.length;
  
  const positive = analyses.filter(a => a.sentimentGlobal.toLowerCase() === 'positif').length;
  const negative = analyses.filter(a => a.sentimentGlobal.toLowerCase() === 'négatif' || a.sentimentGlobal.toLowerCase() === 'negatif').length;
  const neutral = total - positive - negative;

  const positivePercent = total > 0 ? Math.round((positive / total) * 100) : 0;
  const negativePercent = total > 0 ? Math.round((negative / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;

  const sentimentData = [
    { name: 'Positif', value: positivePercent },
    { name: 'Neutre', value: neutralPercent },
    { name: 'Négatif', value: negativePercent },
  ];

  // Simple aggregation for top frustrations & opportunities
  const frustrationsCount: Record<string, number> = {};
  const opportunitiesCount: Record<string, number> = {};

  analyses.forEach(a => {
    const frusts = (a.frustrations as string[]) || [];
    const opps = (a.opportunitesBusiness as string[]) || [];
    
    frusts.forEach(f => {
      frustrationsCount[f] = (frustrationsCount[f] || 0) + 1;
    });
    opps.forEach(o => {
      opportunitiesCount[o] = (opportunitiesCount[o] || 0) + 1;
    });
  });

  const topFrustrations = Object.entries(frustrationsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topOpportunities = Object.entries(opportunitiesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de vos analyses Instagram.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Analyses Totales" 
          value={total} 
          iconName="Activity" 
          delay={0.1}
          trend={total > 0 ? "up" : "neutral"}
          trendValue={total > 0 ? "+1 depuis hier" : "0"}
        />
        <KpiCard 
          title="Sentiment Positif" 
          value={`${positivePercent}%`} 
          iconName="Smile" 
          delay={0.2}
          trend={positivePercent > 50 ? "up" : "neutral"}
          trendValue={`${positivePercent}% du total`}
        />
        <KpiCard 
          title="Sentiment Négatif" 
          value={`${negativePercent}%`} 
          iconName="Frown" 
          delay={0.3}
          trend={negativePercent > 20 ? "down" : "neutral"}
          trendValue={`${negativePercent}% du total`}
        />
        <KpiCard 
          title="Sentiment Neutre" 
          value={`${neutralPercent}%`} 
          iconName="Meh" 
          delay={0.4}
        />
        <KpiCard 
          title="Images Générées" 
          value={imageGenerationsCount} 
          iconName="Image" 
          delay={0.5}
          trend={imageGenerationsCount > 0 ? "up" : "neutral"}
          trendValue="Studio IA"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 lg:col-span-4">
          <Card className="bg-card border-border shadow-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle>Top Frustrations & Opportunités</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
              <div>
                <h4 className="text-sm font-medium text-rose-500 mb-3 flex items-center gap-2">
                  <Frown className="w-4 h-4" /> Top Frustrations
                </h4>
                {topFrustrations.length > 0 ? (
                  <div className="space-y-2">
                    {topFrustrations.map(([f, count], i) => (
                      <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                        <span className="text-foreground/90">{f}</span>
                        <Badge variant="outline" className="text-rose-400 border-rose-500/20">{count} occurences</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucune donnée.</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-emerald-500 mb-3 flex items-center gap-2">
                  <Smile className="w-4 h-4" /> Top Opportunités
                </h4>
                {topOpportunities.length > 0 ? (
                  <div className="space-y-2">
                    {topOpportunities.map(([o, count], i) => (
                      <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                        <span className="text-foreground/90">{o}</span>
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/20">{count} occurences</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucune donnée.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1 lg:col-span-3">
          <SentimentChart data={sentimentData} delay={0.5} />
        </div>
      </div>
    </div>
  );
}
