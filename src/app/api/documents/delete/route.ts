import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const userId = (session as any)?.userId || null;

    const { fileName, deleteAll } = await req.json();

    const n8nCleanupUrl = process.env.N8N_CLEANUP_WEBHOOK_URL || 'http://localhost:5678/webhook/cleanup-pinecone';
    try {
      const n8nResponse = await fetch(n8nCleanupUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: fileName || "", deleteAll: !!deleteAll }),
      });
      if (!n8nResponse.ok) {
        console.warn("Avertissement : n8n n'a pas pu nettoyer Pinecone.");
      }
    } catch (n8nError) {
      console.error("Erreur n8n cleanup:", n8nError);
    }

    if (deleteAll === true) {
      await prisma.uploadedDocument.deleteMany({ where: { userId: userId } });
      return NextResponse.json({ success: true, message: "Tous vos documents supprimés." });
    } else if (fileName) {
      await prisma.uploadedDocument.deleteMany({
        where: { fileName: fileName, userId: userId }
      });
      return NextResponse.json({ success: true, message: `Fichier ${fileName} supprimé.` });
    }

    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  } catch (error: any) {
    console.error("Erreur suppression:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
