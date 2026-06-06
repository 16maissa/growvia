import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  // Get active course (just picking the first one configured with Telegram for simplicity)
  const course = await prisma.course.findFirst({
    where: { userId: session.userId, telegram_bot_active: true },
    orderBy: { createdAt: "desc" }
  });

  if (!course) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center mt-10">
        <h2 className="text-2xl font-bold mb-4">No Active Telegram Bot Found</h2>
        <p className="text-muted-foreground mb-4">You need an active Telegram integration to track student questions.</p>
        <a href="/course/telegram"><Button>Configure Telegram</Button></a>
      </div>
    );
  }

  // Fetch interactions
  const interactions = await prisma.telegramInteraction.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Calculate stats manually since Prisma can't directly group by lowercase string
  const totalQuestions = interactions.length;
  const frequencyMap: Record<string, number> = {};
  for (const int of interactions) {
    const q = int.question.trim().toLowerCase();
    frequencyMap[q] = (frequencyMap[q] || 0) + 1;
  }

  const sortedQuestions = Object.entries(frequencyMap)
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count);

  const reelSuggestions = sortedQuestions.filter(q => q.count >= 3);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Student Questions</h2>
          <p className="text-muted-foreground mt-1">Track what your community is asking in {course.name}.</p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-1.5">
          {totalQuestions} Total Questions
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mt-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
              <CardDescription>Live feed from your Telegram group.</CardDescription>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <MessageCircle className="mx-auto h-8 w-8 mb-3 opacity-50" />
                  <p>No student questions logged yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {interactions.map((int) => (
                    <div key={int.id} className="pb-6 border-b last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">{int.student_name || "Anonymous Student"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(int.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium mb-3 bg-secondary/50 p-3 rounded-md">&quot;{int.question}&quot;</p>
                      <div className="text-sm text-muted-foreground border-l-2 border-primary pl-3 ml-2">
                        {int.answer ? (
                          <div dangerouslySetInnerHTML={{ __html: int.answer }} />
                        ) : (
                          <span className="italic">No automated answer generated.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Frequent Questions & Suggestions */}
        <div className="space-y-6">
          <Card className="border-[#0F6E56]/20 shadow-md">
            <CardHeader className="bg-[#0F6E56]/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-[#0F6E56]">
                <Video className="w-5 h-5" /> Content Opportunities
              </CardTitle>
              <CardDescription>Questions asked 3 or more times.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {reelSuggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center italic">Not enough data yet. Keep gathering questions.</p>
              ) : (
                <div className="space-y-5">
                  {reelSuggestions.map((sug, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium pr-2">&quot;{sug.question}&quot;</span>
                        <Badge variant="secondary" className="shrink-0">{sug.count}x</Badge>
                      </div>
                      <Button size="sm" variant="outline" className="w-full text-xs font-semibold text-[#7F77DD] border-[#7F77DD]/30 hover:bg-[#7F77DD]/10">
                        Generate Reel
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Questions Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedQuestions.slice(0, 10).map((q, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                    <span className="truncate pr-4" title={q.question}>{q.question}</span>
                    <span className="font-semibold text-muted-foreground">{q.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
