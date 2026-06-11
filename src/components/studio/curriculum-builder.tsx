"use client";

import { useState, useRef } from "react";
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  Sparkles,
  Users,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Doc = { id: string; fileName: string };

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner", desc: "Simple analogies, real-world examples", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { value: "medium",   label: "Medium",   desc: "Balanced technical and instructional", color: "text-amber-500",  bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "advanced", label: "Advanced", desc: "Full depth, formulas, deep dives",    color: "text-red-500",    bg: "bg-red-500/10 border-red-500/20" },
];

export default function CurriculumBuilder({ availableDocs }: { availableDocs: Doc[] }) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [age, setAge]                     = useState<number>(14);
  const [difficulty, setDifficulty]       = useState<string>("medium");
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [htmlBlob, setHtmlBlob]           = useState<string | null>(null);
  const [htmlText, setHtmlText]           = useState<string | null>(null);
  const [fullscreen, setFullscreen]       = useState(false);
  const [sending, setSending]             = useState(false);
  const [sent, setSent]                   = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleFile = (name: string) =>
    setSelectedFiles(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );

  const selectAll = () =>
    setSelectedFiles(availableDocs.map(d => d.fileName));

  const isValid = selectedFiles.length > 0;

  const handleGenerate = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError(null);
    setHtmlBlob(null);
    setHtmlText(null);
    setSent(false);

    try {
      const res = await fetch("/api/curriculum/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: selectedFiles, age, difficulty }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || `Server error ${res.status}`);
      }

      const text = await res.text();
      setHtmlBlob(text);
      setHtmlText(text);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!htmlText) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([htmlText], { type: "text/html" }));
    a.download = "Training_Course.html";
    a.click();
  };

  const handleSendToTelegram = async () => {
    if (!htmlText) return;
    setSending(true);
    setSent(false);
    try {
      const res = await fetch("/api/telegram-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer growvia-secret-2025`,
        },
        body: JSON.stringify({
          type: "html_file",
          chat_id: -1003767100563,
          content: {
            html_content: htmlText,
            filename: "Training_Course.html",
            caption: "📚 Nouveau cours généré !",
          },
        }),
      });
      if (res.ok) setSent(true);
    } catch {
      setSent(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Config Card ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8 space-y-8">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Document Matrix Setup</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Select your source PDFs and configure the pedagogical profile below.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: PDF Selection ── */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Source Documents
              </label>
              <button onClick={selectAll} className="text-xs text-violet-500 hover:underline font-semibold">
                Select all
              </button>
            </div>

            {availableDocs.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                No PDFs uploaded yet. Go to <strong>Upload PDF</strong> first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {availableDocs.map(doc => {
                  const checked = selectedFiles.includes(doc.fileName);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => toggleFile(doc.fileName)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                        checked
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-border bg-background hover:border-violet-300 hover:bg-violet-500/5"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        checked ? "bg-violet-500 border-violet-500" : "border-muted-foreground"
                      )}>
                        {checked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium truncate",
                        checked ? "text-violet-700 dark:text-violet-300" : "text-foreground"
                      )}>
                        {doc.fileName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {selectedFiles.length === 0
                ? "No files selected."
                : `${selectedFiles.length} file(s) selected: ${selectedFiles.join(", ")}`}
            </p>
          </div>

          {/* ── Right: Parameters ── */}
          <div className="space-y-6">

            {/* Age */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Target Student Age
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={6} max={18} value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="flex-1 accent-violet-500 cursor-pointer"
                />
                <div className="w-14 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-violet-600 font-bold text-sm">{age} yr</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                <span>6</span><span>12</span><span>18</span>
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Cognitive Difficulty
              </label>
              <div className="space-y-2">
                {DIFFICULTY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDifficulty(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                      difficulty === opt.value
                        ? opt.bg + " " + opt.color.replace("text-", "border-")
                        : "border-border bg-background hover:border-border/80"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full flex-shrink-0",
                      difficulty === opt.value ? opt.color.replace("text-", "bg-") : "bg-muted-foreground/30"
                    )} />
                    <div>
                      <p className={cn("text-sm font-semibold", difficulty === opt.value ? opt.color : "text-foreground")}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            The AI will synthesize all selected documents into a single cohesive HTML course.
          </p>
          <button
            onClick={handleGenerate}
            disabled={!isValid || isLoading}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 min-w-52"
          >
            {isLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Generating Course…</>
            ) : (
              <><Sparkles className="w-5 h-5" />Generate Document Matrix</>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-2 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {/* ── Preview Panel ── */}
      {htmlBlob && (
        <div className={cn(
          "bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all",
          fullscreen ? "fixed inset-4 z-50 shadow-2xl" : "relative"
        )}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gradient-to-r from-violet-600 to-indigo-600">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">Training_Course.html — Live Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download HTML
              </button>
              <button
                onClick={handleSendToTelegram}
                disabled={sending}
                className="flex items-center gap-2 bg-green-500/80 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {sending ? "Envoi…" : sent ? "✅ Envoyé !" : "📤 Envoyer au groupe"}
              </button>
              <button
                onClick={() => setFullscreen(v => !v)}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            srcDoc={htmlBlob}
            title="Training Course Preview"
            className={cn(
              "w-full bg-white",
              fullscreen ? "h-[calc(100%-56px)]" : "h-[70vh]"
            )}
            sandbox="allow-scripts"
          />
        </div>
      )}
    </div>
  );
}
