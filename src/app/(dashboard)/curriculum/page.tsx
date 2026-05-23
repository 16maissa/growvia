import { prisma } from "@/lib/prisma";
import CurriculumBuilder from "@/components/studio/curriculum-builder";

export default async function CurriculumPage() {
  const uploadedDocs = await prisma.uploadedDocument.findMany({
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
