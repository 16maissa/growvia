"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Trash2, 
  Eye, 
  Plus, 
  Loader2, 
  Database, 
  ArrowLeft, 
  Calendar, 
  FileCheck,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

type Document = {
  id: string;
  fileName: string;
  createdAt: string;
};

export default function DocumentsLibraryPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for preview modal
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      } else {
        throw new Error("Failed to fetch documents.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Impossible de charger les documents. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le document "${doc.fileName}" ? Cette action effacera ses données de la base PostgreSQL et de l'index IA Pinecone.`)) {
      return;
    }

    setIsDeletingId(doc.id);
    try {
      const res = await fetch("/api/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: doc.fileName, deleteAll: false }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Remove from local state immediately
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
        if (previewDoc?.id === doc.id) {
          setPreviewDoc(null);
        }
      } else {
        throw new Error(data.error || "Failed to delete.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erreur lors de la suppression : ${err.message || "Une erreur réseau est survenue."}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Ma Bibliothèque</h2>
          <p className="text-muted-foreground mt-2">
            Gérez vos documents importés et synchronisez vos bases PostgreSQL et IA (Pinecone).
          </p>
        </div>
        <Link 
          href="/pdf-upload"
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          Importer un document
        </Link>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Chargement de votre bibliothèque...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-6 text-center max-w-xl mx-auto space-y-4">
          <p className="font-semibold">{error}</p>
          <button 
            onClick={fetchDocuments}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-xl text-sm font-semibold hover:bg-destructive/95 transition"
          >
            Réessayer
          </button>
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <div className="border-2 border-dashed border-border/80 rounded-3xl p-12 text-center max-w-2xl mx-auto bg-card/30 flex flex-col items-center justify-center space-y-6">
          <div className="p-4 bg-primary/10 rounded-full text-primary">
            <Database className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">Bibliothèque vide</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              Aucun document importé. Commencez par téléverser vos fichiers !
            </p>
          </div>
          <Link 
            href="/pdf-upload"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            Téléverser mon premier PDF
          </Link>
        </div>
      ) : (
        /* Grid Display */
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  
                  {/* Delete button (French tooltips and warnings) */}
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={isDeletingId !== null}
                    className={cn(
                      "p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all",
                      isDeletingId === doc.id ? "opacity-40 pointer-events-none" : ""
                    )}
                    title="Supprimer définitivement"
                  >
                    {isDeletingId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Title & Metadata */}
                <div className="space-y-1.5 min-w-0">
                  <h4 
                    className="font-bold text-foreground text-base truncate" 
                    title={doc.fileName}
                  >
                    {doc.fileName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="pt-5 mt-5 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  <FileCheck className="w-3 h-3" />
                  <span>Indexé (IA)</span>
                </div>
                
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold px-3 py-1.5 hover:bg-primary/5 rounded-lg transition"
                >
                  <Eye className="w-4 h-4" />
                  Visualiser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog / Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/80 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-foreground truncate max-w-md" title={previewDoc.fileName}>
                    {previewDoc.fileName}
                  </h3>
                  <p className="text-xs text-muted-foreground">Prévisualisation du document</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 hover:bg-muted rounded-xl transition text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              {/* Metadata details */}
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Nom du fichier</span>
                  <span className="font-semibold text-foreground truncate block">{previewDoc.fileName}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Date d'importation</span>
                  <span className="font-semibold text-foreground block">
                    {new Date(previewDoc.createdAt).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Statut de la base</span>
                  <span className="font-semibold text-emerald-500 block">Enregistré dans Postgres</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">Index Vectoriel</span>
                  <span className="font-semibold text-emerald-500 block">Actif dans Pinecone (IA)</span>
                </div>
              </div>

              {/* Simulated PDF pages preview */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Aperçu du contenu indexé</h4>
                <div className="border border-border rounded-2xl bg-muted/10 p-5 space-y-4 font-mono text-xs leading-relaxed text-muted-foreground max-h-56 overflow-y-auto">
                  <div className="border-b border-border/50 pb-2 mb-2 font-bold text-foreground">
                    --- PAGE 1 / INITIALIZATION ---
                  </div>
                  <p>
                    Document importé avec succès. Les chunks et vecteurs associés ont été générés à l'aide de l'intégration IA. 
                    Vous pouvez utiliser ce contenu dans le Générateur de Quiz ou le Curriculum Builder.
                  </p>
                  <p>
                    [Indexation RAG active]
                    Les vecteurs correspondants sont stockés dans l'index Pinecone et sont reliés à l'identifiant PostgreSQL unique de ce document.
                  </p>
                  <div className="border-b border-border/50 pb-2 mt-4 mb-2 font-bold text-foreground">
                    --- PAGE 2 / TEXT SEGMENTATION ---
                  </div>
                  <p>
                    Analyse structurelle et extraction de thématiques clés. Les questions du quiz générées à partir de ce fichier s'appuieront sur la base de connaissances vectorisée correspondante.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-muted/10 border-t border-border/80 flex items-center justify-between">
              <button
                onClick={() => handleDelete(previewDoc)}
                disabled={isDeletingId !== null}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 font-bold px-3 py-2 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer le document
              </button>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="bg-muted hover:bg-muted/80 text-foreground font-semibold px-4 py-2 rounded-xl text-sm transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
