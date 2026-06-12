import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuizStudio from "@/components/studio/quiz-studio";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  // Fetch only this user's PDFs
  const uploadedDocs = await prisma.uploadedDocument.findMany({
    where: { userId: session.userId },
    distinct: ["fileName"],
    orderBy: { createdAt: "desc" },
    select: { id: true, fileName: true },
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Quiz Generator</h2>
      </div>

      {/* Client Component for the Studio Logic */}
      <QuizStudio availableDocs={uploadedDocs} />
    </div>
  );
}
