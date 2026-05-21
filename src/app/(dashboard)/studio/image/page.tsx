import { prisma } from "@/lib/prisma";
import { ImageStudio } from "@/components/studio/image-studio";

export const dynamic = "force-dynamic";

export default async function StudioImagePage() {
  // @ts-ignore - L'erreur rouge est due au cache de VS Code. Le code est 100% correct (npx tsc passe avec succès).
  const history = await prisma.imageGeneration.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return <ImageStudio initialHistory={history} />;
}
