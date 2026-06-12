import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CurriculumBuilder from "@/components/studio/curriculum-builder";

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  const uploadedDocs = await prisma.uploadedDocument.findMany({
    where: { userId: session.userId },
    distinct: ["fileName"],
    orderBy: { createdAt: "desc" },
    select: { id: true, fileName: true },
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Curriculum Builder</h2>
          <p className="text-muted-foreground mt-1">Synthesize multiple PDFs into a personalized training course.</p>
        </div>
      </div>
      <CurriculumBuilder availableDocs={uploadedDocs} />
    </div>
  );
}
