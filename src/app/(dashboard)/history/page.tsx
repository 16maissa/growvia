import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const analyses = await prisma.analysis.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Historique des Analyses</h2>
        <p className="text-muted-foreground mt-2">
          Retrouvez toutes les analyses générées par l'IA.
        </p>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle>Analyses Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Compte</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Sentiment Global</TableHead>
                  <TableHead className="text-muted-foreground">Frustrations</TableHead>
                  <TableHead className="text-muted-foreground">Opportunités</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucune analyse trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  analyses.map((analysis) => (
                    <TableRow key={analysis.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium">@{analysis.instagramUsername}</TableCell>
                      <TableCell>{format(new Date(analysis.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            analysis.sentimentGlobal.toLowerCase().includes('positif') ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" :
                            analysis.sentimentGlobal.toLowerCase().includes('négatif') || analysis.sentimentGlobal.toLowerCase().includes('negatif') ? "text-rose-500 border-rose-500/20 bg-rose-500/10" :
                            "text-amber-500 border-amber-500/20 bg-amber-500/10"
                          }
                        >
                          {analysis.sentimentGlobal}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {((analysis.frustrations as string[]) || []).length} items
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {((analysis.opportunitesBusiness as string[]) || []).length} items
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
