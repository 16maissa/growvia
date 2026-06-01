"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Video, CheckCircle2, Film, Image as ImageIcon, Volume2, Sparkles, PlayCircle, AlertCircle } from "lucide-react";

// @ts-ignore
import { VideoProject, Scene } from "@prisma/client";

interface VideoProjectWithScenes extends VideoProject {
  scenes: Scene[];
}

export function VideoAgentStudio() {
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<VideoProjectWithScenes | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!chatInput.trim()) return;

    setIsGenerating(true);
    setError(null);
    setProjectId(null);
    setProject(null);

    try {
      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatInput }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to start video generation");
      }

      setProjectId(data.projectId);
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/video/status/${projectId}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setProject(data.project);

          if (data.project.status === "COMPLETED" || data.project.status === "FAILED") {
            setIsGenerating(false);
          }
        }
      } catch (err) {
        console.error("Error polling status:", err);
      }
    };

    // Fetch immediately
    fetchStatus();

    // Then poll
    const interval = setInterval(() => {
      if (!isGenerating && project?.status === "COMPLETED") return;
      if (!isGenerating && project?.status === "FAILED") return;
      
      fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, isGenerating, project?.status]);

  const renderSceneProgress = () => {
    // We expect exactly 4 scenes according to the prompt
    const scenes = project?.scenes || [];
    
    // Create placeholders if scenes are not yet generated
    const displayScenes = Array.from({ length: 4 }).map((_, index) => {
      const scene = scenes.find((s) => s.sceneNumber === index + 1);
      return scene || { sceneNumber: index + 1, id: `placeholder-${index}` } as Partial<Scene>;
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {displayScenes.map((scene) => (
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: scene.sceneNumber! * 0.1 }}
          >
            <Card className="bg-card/40 backdrop-blur-md border-primary/20 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardContent className="p-5 flex flex-col h-full z-10 relative">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Film className="w-5 h-5 text-primary" />
                    Scene {scene.sceneNumber}
                  </h4>
                  {scene.videoUrl ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : null}
                </div>
                
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-3 text-sm">
                    <ImageIcon className={`w-4 h-4 ${scene.imageUrl ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    <span className={scene.imageUrl ? 'text-foreground' : 'text-muted-foreground'}>
                      Image Generation {scene.imageUrl && '✅'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Volume2 className={`w-4 h-4 ${scene.audioUrl ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    <span className={scene.audioUrl ? 'text-foreground' : 'text-muted-foreground'}>
                      Voiceover (TTS) {scene.audioUrl && '✅'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Video className={`w-4 h-4 ${scene.videoUrl ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    <span className={scene.videoUrl ? 'text-foreground' : 'text-muted-foreground'}>
                      Video Render {scene.videoUrl && '✅'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent inline-block">
          AI Video Studio
        </h2>
        <p className="text-muted-foreground mt-2">
          Enter an educational topic and let our multi-agent pipeline generate a complete 4-scene video with AI-generated visuals and voiceovers.
        </p>
      </div>

      <Card className="bg-card/50 backdrop-blur-xl border-primary/20 shadow-2xl shadow-primary/10">
        <CardContent className="p-6">
          <div className="space-y-4">
            <label htmlFor="topic" className="block text-sm font-medium text-foreground mb-2">
              Video Topic or Subject
            </label>
            <textarea
              id="topic"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Explain the theory of relativity in simple terms..."
              className="w-full min-h-[100px] p-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground backdrop-blur-sm"
              disabled={isGenerating}
            />

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 text-sm text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !chatInput.trim()}
              className="w-full py-6 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/25 rounded-xl transition-all duration-300 transform hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Generating Pipeline...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 h-5 w-5" />
                  Generate Video Workflow
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isGenerating || project) && (
        <div className="space-y-8 mt-12">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-2xl font-semibold flex items-center gap-3">
              <PlayCircle className="w-6 h-6 text-primary" />
              Pipeline Status: 
              <span className={`text-sm px-3 py-1 rounded-full border ${
                project?.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                project?.status === 'FAILED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                'bg-primary/10 text-primary border-primary/20 animate-pulse'
              }`}>
                {project?.status || 'INITIALIZING'}
              </span>
            </h3>
          </div>

          {renderSceneProgress()}

          {project?.status === "COMPLETED" && project.videoUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12"
            >
              <Card className="bg-black border-primary/30 overflow-hidden shadow-2xl shadow-primary/20 rounded-2xl">
                <CardContent className="p-0 relative group">
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white text-xs flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-primary" />
                      Final Assembly Ready
                    </div>
                  </div>
                  <video 
                    controls 
                    className="w-full aspect-video outline-none"
                    poster={project.scenes?.[0]?.imageUrl || undefined}
                  >
                    <source src={project.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
