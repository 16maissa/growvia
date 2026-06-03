"use client";

import { useState, useEffect } from "react";
import { BrainCircuit, Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Doc = { id: string; fileName: string };
type Question = {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer?: string;
};

// ─── Interactive Question Card ───────────────────────────────────────────────
function QuestionCard({ q, index, showAnswers }: { q: Question; index: number; showAnswers: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);

  const letters = ["A", "B", "C", "D", "E"];

  const getOptionState = (opt: string) => {
    if (!selected) return "idle";
    if (showAnswers && q.correctAnswer) {
      if (opt === q.correctAnswer) return "correct";
      if (opt === selected && opt !== q.correctAnswer) return "wrong";
    }
    if (opt === selected) return "selected";
    return "idle";
  };

  const stateStyles: Record<string, string> = {
    idle: "border-border bg-card hover:border-indigo-500 hover:bg-indigo-500/5 cursor-pointer",
    selected: "border-indigo-500 bg-indigo-500/10 cursor-pointer",
    correct: "border-emerald-500 bg-emerald-500/10 cursor-default",
    wrong: "border-red-500 bg-red-500/10 cursor-default",
  };

  const badgeStyles: Record<string, string> = {
    idle: "bg-muted text-muted-foreground group-hover:bg-indigo-500/20 group-hover:text-indigo-600",
    selected: "bg-indigo-500 text-white",
    correct: "bg-emerald-500 text-white",
    wrong: "bg-red-500 text-white",
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Question Header */}
      <div className="px-6 py-5 border-b border-border/50">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 mb-4">
          Question {index + 1}
        </span>
        <h4 className="text-lg md:text-xl font-bold text-foreground leading-snug">
          {q.questionText}
        </h4>
      </div>

      {/* Options */}
      <div className="p-4 md:p-6 space-y-3">
        {q.options.map((opt, i) => {
          const state = getOptionState(opt);
          return (
            <button
              key={i}
              onClick={() => !selected && setSelected(opt)}
              disabled={!!selected}
              className={cn(
                "w-full group flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all duration-150 text-left",
                stateStyles[state]
              )}
            >
              <span className={cn(
                "flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm transition-colors",
                badgeStyles[state]
              )}>
                {letters[i]}
              </span>
              <span className="font-medium text-foreground/90 flex-1">{opt}</span>
              {state === "correct" && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
              {state === "wrong" && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              {state === "idle" && !selected && (
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Answer reveal */}
      {selected && q.correctAnswer && showAnswers && (
        <div className={cn(
          "px-6 py-3 text-sm font-medium border-t border-border/50",
          selected === q.correctAnswer
            ? "bg-emerald-500/5 text-emerald-600"
            : "bg-red-500/5 text-red-500"
        )}>
          {selected === q.correctAnswer ? "✅ Correct!" : `❌ Correct answer: ${q.correctAnswer}`}
        </div>
      )}
    </div>
  );
}

// ─── Answer Key Panel ─────────────────────────────────────────────────────────
function AnswerKey({ questions }: { questions: Question[] }) {
  const withAnswers = questions.filter(q => q.correctAnswer);
  if (withAnswers.length === 0) return null;

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-emerald-500/20 bg-emerald-500/10 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-emerald-600" />
        <h3 className="text-base font-bold text-emerald-700">Answer Key</h3>
      </div>
      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {withAnswers.map((q) => (
          <div key={q.id} className="bg-card border border-border rounded-xl px-4 py-3 text-sm">
            <span className="font-bold text-muted-foreground">Q{q.id}. </span>
            <span className="font-semibold text-foreground">{q.correctAnswer}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuizStudio({ availableDocs }: { availableDocs: Doc[] }) {
  const [docs, setDocs] = useState<Doc[]>(availableDocs);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [easyCount, setEasyCount] = useState(3);
  const [mediumCount, setMediumCount] = useState(5);
  const [hardCount, setHardCount] = useState(2);
  const [choicesCount, setChoicesCount] = useState(4);
  const [showAnswers, setShowAnswers] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentSum = easyCount + mediumCount + hardCount;
  const isValid = currentSum === totalQuestions && selectedFiles.length > 0;

  useEffect(() => {
    setDocs(availableDocs);
  }, [availableDocs]);

  const handleFileToggle = (fileName: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileName) ? prev.filter(f => f !== fileName) : [...prev, fileName]
    );
  };

  const handleGenerate = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError(null);
    setQuestions(null);
    setShowAnswers(false);

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFiles, totalQuestions, easyCount, mediumCount, hardCount, choicesCount }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to generate quiz.");
      setQuestions(data.questions);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* ── Config Card ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8 space-y-8">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Create a Custom Quiz</h2>
            <p className="text-muted-foreground text-sm mt-1">Generate interactive questions tailored from your uploaded PDFs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          {/* Left: PDF + Total + Choices */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select PDFs</label>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {docs.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No PDF available. Please import one first.</p>
                ) : docs.map(doc => (
                  <label key={doc.id} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={selectedFiles.includes(doc.fileName)} onChange={() => handleFileToggle(doc.fileName)} className="peer sr-only" />
                      <div className="w-5 h-5 border-2 border-muted-foreground rounded bg-transparent peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all" />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-foreground group-hover:text-indigo-500 transition-colors truncate">{doc.fileName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Questions</label>
                <span className="text-sm font-bold text-indigo-500">{totalQuestions}</span>
              </div>
              <input type="range" min="1" max="50" value={totalQuestions} onChange={e => setTotalQuestions(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choices per Question</label>
              <select value={choicesCount} onChange={e => setChoicesCount(Number(e.target.value))} className="w-full bg-background border border-border text-foreground text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none">
                <option value={2}>2 Options (A / B)</option>
                <option value={3}>3 Options (A / B / C)</option>
                <option value={4}>4 Options (A / B / C / D)</option>
              </select>
            </div>
          </div>

          {/* Right: Difficulty Matrix */}
          <div className="space-y-5 bg-muted/30 p-5 rounded-xl border border-border/60">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difficulty Breakdown</label>
              <span className={cn("text-xs font-bold px-2 py-1 rounded-md", currentSum === totalQuestions ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                {currentSum} / {totalQuestions}
              </span>
            </div>

            {[
              { label: "Easy", value: easyCount, setter: setEasyCount, color: "text-emerald-500" },
              { label: "Medium", value: mediumCount, setter: setMediumCount, color: "text-amber-500" },
              { label: "Hard", value: hardCount, setter: setHardCount, color: "text-red-500" },
            ].map(({ label, value, setter, color }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className={cn("text-sm font-semibold w-16", color)}>{label}</span>
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => setter(Math.max(0, value - 1))} className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center text-lg leading-none">-</button>
                  <span className="w-8 text-center font-bold text-foreground">{value}</span>
                  <button onClick={() => setter(value + 1)} className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center text-lg leading-none">+</button>
                </div>
              </div>
            ))}

            {currentSum !== totalQuestions && (
              <div className="flex items-start gap-2 text-red-400 bg-red-400/10 p-3 rounded-xl text-xs leading-snug">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>The sum ({currentSum}) must equal total questions ({totalQuestions}).</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {selectedFiles.length === 0 ? "Select at least 1 document." : `${selectedFiles.length} file(s) selected.`}
          </p>
          <button
            onClick={handleGenerate}
            disabled={!isValid || isLoading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Generating…</> : <><Sparkles className="w-5 h-5" />Generate Quiz</>}
          </button>
        </div>

        {error && (
          <div className="mt-2 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </div>

      {/* ── Quiz Output ── */}
      {questions && questions.length > 0 && (
        <div className="space-y-4">
          {/* Quiz header bar */}
          <div className="rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 px-6 py-5 flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-xl">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Generated Quiz</h3>
                <div className="mt-2 h-1.5 bg-white/20 rounded-full">
                  <div className="h-full bg-white rounded-full" style={{ width: `${(1 / questions.length) * 100}%` }} />
                </div>
              </div>
              <span className="text-white/80 text-sm font-semibold">{questions.length} Questions</span>
            </div>
          </div>

          {/* Toggle answer key */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAnswers(v => !v)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors",
                showAnswers
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-4 h-4" />
              {showAnswers ? "Hide Answers" : "Show Answers"}
            </button>
          </div>

          {/* Question cards */}
          <div className="space-y-4">
            {questions.map((q, i) => (
              <QuestionCard key={q.id ?? i} q={q} index={i} showAnswers={showAnswers} />
            ))}
          </div>

          {/* Answer Key */}
          <AnswerKey questions={questions} />
        </div>
      )}
    </div>
  );
}
