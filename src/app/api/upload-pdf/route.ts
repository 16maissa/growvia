import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const userId = (session as any)?.userId || null;

    const formData = await req.formData();
    
    // n8n expects binary field named 'data'
    const file = formData.get("data") as File | null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided in 'data' field" },
        { status: 400 }
      );
    }

    // Prevent duplicate file uploads
    const existingDoc = await prisma.uploadedDocument.findFirst({
      where: { fileName: file.name, userId: userId }
    });

    if (existingDoc) {
      return NextResponse.json(
        { error: "Ce document existe déjà dans votre bibliothèque." },
        { status: 400 }
      );
    }

    // Convert File to a standard Blob to ensure fetch serializes it as binary properly
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || "application/pdf" });

    // Create a new FormData object to forward the file to n8n
    const n8nFormData = new FormData();
    n8nFormData.append("data", blob, file.name); // IMPORTANT: passed explicitly so n8n knows it's a PDF
    n8nFormData.append("fileName", file.name);
    n8nFormData.append("name", file.name);
    n8nFormData.append("userId", userId || "");

    const webhookUrl = process.env.N8N_PDF_UPLOAD_WEBHOOK_URL || "http://localhost:5678/webhook/upload-pdf";
    
    console.log("=== [DEBUG] Envoi du fichier à n8n... ===");
    
    // Send to n8n webhook
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      body: n8nFormData,
    });

    // 1. On récupère d'abord la réponse sous forme de TEXTE brut
    const n8nRawText = await n8nResponse.text();
    
    console.log(`=== [DEBUG] Réponse brute reçue de n8n (Status: ${n8nResponse.status}) ===`);
    console.log(n8nRawText || "[Réponse vide de n8n]");
    console.log("=================================================");

    if (!n8nResponse.ok) {
      return NextResponse.json(
        { success: false, error: `Erreur n8n (${n8nResponse.status}): ${n8nRawText}` },
        { status: n8nResponse.status }
      );
    }

    // 2. On tente de parser prudemment le texte en JSON
    let n8nData: any = {};
    if (n8nRawText.trim() === "") {
      console.log("=== [INFO] n8n a renvoyé un 200 OK mais avec un corps vide. On considère que c'est un succès. ===");
      n8nData = { success: true, message: "Traitement réussi (réponse vide de n8n)" };
    } else {
      try {
        n8nData = JSON.parse(n8nRawText);
      } catch (jsonError) {
        console.error("=== [ERREUR] Impossible de lire le JSON de n8n ===");
        return NextResponse.json(
          { 
            success: false, 
            error: "n8n a renvoyé un format texte (non JSON). Assurez-vous d'utiliser un nœud 'Respond to Webhook' configuré en JSON.", 
            rawResponse: n8nRawText 
          },
          { status: 502 }
        );
      }
    }

    // Store document metadata in PostgreSQL
    const document = await prisma.uploadedDocument.create({
      data: {
        fileName: file.name,
        userId: userId,
      },
    });

    // n8n should respond with { success: true, message: "...", file: "filename.pdf" }
    return NextResponse.json({
      success: true,
      message: n8nData.message || "File processed successfully",
      file: file.name,
      documentId: document.id
    }, { status: 200 });

  } catch (error: any) {
    console.error("PDF Upload Backend Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}