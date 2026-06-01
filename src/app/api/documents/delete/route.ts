import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API pour supprimer un fichier spécifique OU vider complètement la base (Postgres + Pinecone)
 * POST /api/documents/delete
 */
export async function POST(req: Request) {
  try {
    const { fileName, deleteAll } = await req.json();

    // 1. SUPPRESSION DANS PINECONE (via n8n)
    const n8nCleanupUrl = process.env.N8N_CLEANUP_WEBHOOK_URL || 'http://localhost:5678/webhook/cleanup-pinecone';
    
    try {
      const n8nResponse = await fetch(n8nCleanupUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: fileName || "",
          deleteAll: !!deleteAll,
        }),
      });

      if (!n8nResponse.ok) {
        console.warn("Avertissement : n8n n'a pas pu nettoyer Pinecone complètement.");
      }
    } catch (n8nError) {
      // On logue l'erreur mais on ne bloque pas la suppression Postgres en cas de problème réseau temporaire
      console.error("Erreur de connexion avec n8n pour le nettoyage de Pinecone :", n8nError);
    }

    // 2. SUPPRESSION DANS POSTGRESQL (via Prisma)
    if (deleteAll === true) {
      // Cas A : On vide TOUT
      await prisma.uploadedDocument.deleteMany({});
      return NextResponse.json({ 
        success: true, 
        message: "Base de données PostgreSQL et Index Pinecone vidés avec succès." 
      });
    } else if (fileName) {
      // Cas B : On supprime un fichier ciblé (et tous ses doublons d'uploads d'historique)
      await prisma.uploadedDocument.deleteMany({
        where: {
          fileName: fileName
        }
      });
      return NextResponse.json({ 
        success: true, 
        message: `Fichier ${fileName} supprimé de PostgreSQL et Pinecone.` 
      });
    }

    return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });

  } catch (error: any) {
    console.error("Erreur lors de la suppression unifiée :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression." },
      { status: 500 }
    );
  }
}
