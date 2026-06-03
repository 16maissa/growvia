"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, ImageIcon, Loader2, History } from "lucide-react";
// @ts-ignore - TS server needs restart to see the export
import { ImageGeneration } from "@prisma/client";

interface ImageStudioProps {
  initialHistory: ImageGeneration[];
}

export function ImageStudio({ initialHistory }: ImageStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<ImageGeneration | null>(null);
  const [history, setHistory] = useState<ImageGeneration[]>(initialHistory);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate image");
      }

      setCurrentImage(data.imageGeneration);
      setHistory((prev) => [data.imageGeneration, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (base64Data: string, promptText: string) => {
    // Determine the content type and prefix if missing
    const isPrefixed = base64Data.startsWith('data:image');
    const href = isPrefixed ? base64Data : `data:image/png;base64,${base64Data}`;
    
    const a = document.createElement("a");
    a.href = href;
    a.download = `generation-${promptText.slice(0, 20).replace(/\s+/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getImgSrc = (base64: string) => {
    return base64.startsWith('data:image') ? base64 : `data:image/png;base64,${base64}`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent inline-block">
          Studio AI - Image
        </h2>
        <p className="text-muted-foreground mt-2">
          Generate unique visuals with artificial intelligence for your content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-card/50 backdrop-blur-md border-primary/20 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-foreground mb-2">
                    Prompt (Image description)
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic landscape with pink and blue neon lights..."
                    className="w-full min-h-[120px] p-3 rounded-md bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground"
                    disabled={isGenerating}
                  />
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 text-sm text-rose-500 bg-rose-500/10 rounded-md border border-rose-500/20">
                    {error}
                  </motion.div>
                )}

                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating... (up to 60s)
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate image
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="bg-card/50 backdrop-blur-md border-border h-full min-h-[400px] flex flex-col overflow-hidden">
            <CardContent className="p-0 flex-1 flex items-center justify-center relative">
              {currentImage ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full relative group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={getImgSrc(currentImage.imageBase64)} 
                    alt={currentImage.prompt}
                    className="w-full h-full object-contain bg-black/20"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button 
                      variant="outline" 
                      className="bg-background/20 backdrop-blur-md border-white/20 hover:bg-white/20 text-white"
                      onClick={() => handleDownload(currentImage.imageBase64, currentImage.prompt)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </motion.div>
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                    <Sparkles className="h-12 w-12 text-primary animate-bounce relative z-10" />
                  </div>
                  <p className="animate-pulse">Creating the magic...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                  <p>Your generated image will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <History className="mr-2 h-5 w-5 text-primary" /> Generation history
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative rounded-lg overflow-hidden border border-border bg-card cursor-pointer"
                onClick={() => setCurrentImage(item)}
              >
                <div className="aspect-square relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={getImgSrc(item.imageBase64)} 
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
                    <p className="text-xs text-white line-clamp-2">{item.prompt}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
