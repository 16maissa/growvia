const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/audit/audit-dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update TaskCard handleGenerate & buttons
const taskCardRegex = /const handleGenerate = async \(\) => \{[\s\S]*?className="mt-4 pt-4 border-t border-border overflow-hidden"/;

const newTaskCardInner = `const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/orchestrator/generate-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: action.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation error");
      if (data.skipped) {
        setStatus("skipped");
        setGenError(data.error || "Skipped: Already generated");
      } else {
        setGeneratedContent(data.content);
        setStatus("done");
        setShowContent(true);
      }
    } catch (e: any) {
      setGenError(e.message || "Generation error, please retry.");
      setStatus("failed");
    } finally {
      setGenerating(false);
    }
  };

  const isDone = status === "done";
  const isFailed = status === "failed";
  const isRunning = status === "running" || generating;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={\`rounded-xl border p-4 transition-all bg-card \${
        isDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"
      }\`}>
      {/* Task Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={\`text-xs border \${typeClass}\`}>{action.content_type?.toUpperCase()}</Badge>
            <span className="text-xs text-muted-foreground capitalize">{action.day_of_week} · {action.optimal_hour ?? ""}</span>
            <Badge variant="outline" className={\`text-[10px] ml-2 \${statusColor}\`}>
              {isDone ? "✓ Done" : status}
            </Badge>
          </div>
          <p className="font-medium text-sm">{action.topic}</p>
          {action.cta && <p className="text-xs text-muted-foreground mt-1">CTA: <span className="italic">{action.cta}</span></p>}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          {status === "planned" && currentMode === "semi_auto" && (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isRunning}
              className="text-xs h-8 gap-1.5 min-w-[110px]"
            >
              {isRunning ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
              ) : (
                <>⚡ Generate</>
              )}
            </Button>
          )}

          {isFailed && (
            <Button size="sm" onClick={handleGenerate} disabled={isRunning} variant="outline" className="text-xs h-8 text-rose-500">
              {isRunning ? "Retrying..." : "Retry"}
            </Button>
          )}

          {isDone && (
            <Button size="sm" variant="outline" onClick={() => setShowContent(v => !v)} className="text-xs h-8">
              {showContent ? "Hide" : "View Draft"}
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {genError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {genError}
        </div>
      )}

      {/* Generated content display */}
      <AnimatePresence>
        {showContent && generatedContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border overflow-hidden"`;

content = content.replace(taskCardRegex, newTaskCardInner);

// 2. Add Modal import if needed
if (!content.includes('import { Input }')) {
  content = content.replace('import { Button } from "@/components/ui/button";', 'import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\nimport { Label } from "@/components/ui/label";\nimport { Textarea } from "@/components/ui/textarea";');
}

// 3. Update AuditDashboard state and submit
content = content.replace('const [activeTab, setActiveTab] = useState<"overview" | "errors" | "plan" | "revenue" | "ai">("overview");', 'const [activeTab, setActiveTab] = useState<"overview" | "errors" | "revenue" | "ai">("overview");\n  const [showAnalysisForm, setShowAnalysisForm] = useState(false);\n  const [niche, setNiche] = useState("");\n  const [audience, setAudience] = useState("");\n  const [goals, setGoals] = useState("");\n  const [preferences, setPreferences] = useState("");\n  const [isAnalyzing, setIsAnalyzing] = useState(false);');

// 4. handleModeChange update
const handleModeChangeRegex = /const handleModeChange = async \(newMode: string\) => \{[\s\S]*?setModeError\(null\);/;
const newHandleModeChange = `const handleModeChange = async (newMode: string) => {
    if (newMode === "semi_auto" && plans.length === 0 && !showAnalysisForm) {
      setShowAnalysisForm(true);
      return;
    }
    setIsChangingMode(true);
    setModeError(null);`;
content = content.replace(handleModeChangeRegex, newHandleModeChange);

// Add handleAnalysisSubmit
const submitFunc = `
  const handleAnalysisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setModeError(null);
    try {
      const planRes = await fetch("/api/orchestrator/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, audience, goals, preferences })
      });
      if (!planRes.ok) throw new Error("Failed to generate plan");
      
      const res = await fetch("/api/automation/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "semi_auto" })
      });
      if (!res.ok) throw new Error("Error changing mode");
      
      setShowAnalysisForm(false);
      router.refresh();
    } catch (e: any) {
      setModeError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
`;
content = content.replace('const errors: AuditError[]', submitFunc + '\n  const errors: AuditError[]');

// 5. Update tabs array
content = content.replace('{ id: "plan",     label: `90-Day Plan (${plans.length})`, icon: Target },\n', '');

// 6. Update Layout: wrap the bottom part in grid
const planTabStart = content.indexOf('{/* ── PLAN TAB ── */}');
const planTabEnd = content.indexOf('{/* ── REVENUE TAB ── */}');

// extract the plan content
let planContent = content.substring(planTabStart, planTabEnd);
// strip the AnimatePresence and activeTab check from planContent
planContent = planContent.replace(/{activeTab === "plan" && \([\s\S]*?<motion\.div[^>]*>/, '<div className="space-y-6">');
planContent = planContent.replace(/<\/motion\.div>\s*\)\}\s*$/, '</div>');

// remove plan tab from main content
content = content.substring(0, planTabStart) + content.substring(planTabEnd);

// insert grid start
content = content.replace('{/* ── Course Widget ── */}', 
  `<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-8">
      {/* ── Course Widget ── */}`
);

// close the left column and insert the right column before the last AnimatePresence close
const lastAnimateIdx = content.lastIndexOf('</AnimatePresence>');
content = content.substring(0, lastAnimateIdx) + 
  `</AnimatePresence>
    </div>
    
    <div className="lg:col-span-1 space-y-6">
      <div className="sticky top-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Action Plan</h2>
        </div>
        ${planContent}
      </div>
    </div>
  </div>

  {/* Modal for Analysis Form */}
  <AnimatePresence>
    {showAnalysisForm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card w-full max-w-lg rounded-xl shadow-xl border border-border p-6 relative overflow-y-auto max-h-[90vh]">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setShowAnalysisForm(false)}><XCircle className="w-5 h-5" /></Button>
          <h2 className="text-2xl font-bold mb-2">Deep Profile Analysis</h2>
          <p className="text-sm text-muted-foreground mb-6">Tell us about your strategy to generate a personalized 90-day action plan.</p>
          <form onSubmit={handleAnalysisSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Main Niche</Label>
              <Input required placeholder="e.g. Fitness, Real Estate, Coaching..." value={niche} onChange={e => setNiche(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Input required placeholder="Who are you trying to reach?" value={audience} onChange={e => setAudience(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Main Goals</Label>
              <Input required placeholder="e.g. More sales, followers, engagement..." value={goals} onChange={e => setGoals(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Content Preferences</Label>
              <Textarea placeholder="Any specific topics or formats you like?" value={preferences} onChange={e => setPreferences(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isAnalyzing}>
              {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Analyzing your profile...</> : "Start Deep Analysis"}
            </Button>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
</div>
  );
}`;

// Remove 'guide' ModeCard and update 'semi'
content = content.replace(/<ModeCard[\s\S]*?title="Guide"[\s\S]*?\/>/, '');
content = content.replace(/title="Semi-Auto" icon=\{Activity\} mode="semi"/, 'title="Semi-Auto" icon={Activity} mode="semi_auto"');
content = content.replace(/onClick=\{\(\) => handleModeChange\("semi"\)\}/, 'onClick={() => handleModeChange("semi_auto")}');
content = content.replace(/currentMode === "semi"/g, 'currentMode === "semi_auto"');

// Fix text in Mode Selector
content = content.replace('Pause Agent', 'Stop Automations');
content = content.replace('handleModeChange("guide")', 'handleModeChange("libre")');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Refactoring complete");
