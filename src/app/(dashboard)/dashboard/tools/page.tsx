"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Video, Image as ImageIcon, CheckSquare, MessageSquare, Hash } from "lucide-react";

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [inputData, setInputData] = useState<any>({});
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const tools = [
    { id: "reel-script", name: "Script Reel", icon: Video, desc: "Génère un script captivant pour Reel" },
    { id: "carousel", name: "Texte Carousel", icon: ImageIcon, desc: "Génère les slides textuelles d'un carousel" },
    { id: "quiz", name: "Générateur Quiz", icon: CheckSquare, desc: "Crée des questions pour vos stories" },
    { id: "caption", name: "Légende Optimisée", icon: MessageSquare, desc: "Rédige la description parfaite" },
    { id: "hashtags", name: "Hashtags de Niche", icon: Hash, desc: "Trouve les meilleurs hashtags" },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTool) return;
    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/tools/${activeTool}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Outils d'Intelligence Artificielle</h2>
        <p className="text-muted-foreground mt-2">Accès rapide aux générateurs spécifiques (Mode Libre).</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tools.map((tool) => (
          <Card 
            key={tool.id} 
            className={`cursor-pointer transition-all hover:border-primary/50 ${activeTool === tool.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border'}`}
            onClick={() => { setActiveTool(tool.id); setResult(null); }}
          >
            <CardHeader className="p-4 items-center text-center">
              <tool.icon className={`w-8 h-8 mb-2 ${activeTool === tool.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <CardTitle className="text-sm">{tool.name}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {activeTool && (
        <Card className="bg-card/50 backdrop-blur-xl border-primary/20 shadow-xl mt-8">
          <CardHeader>
            <CardTitle>{tools.find(t => t.id === activeTool)?.name}</CardTitle>
            <CardDescription>{tools.find(t => t.id === activeTool)?.desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sujet Principal</Label>
                  <Input 
                    required 
                    placeholder="De quoi ça parle ?" 
                    value={inputData.sujet || inputData.topic || inputData.titre || ''} 
                    onChange={e => setInputData({...inputData, sujet: e.target.value, topic: e.target.value, titre: e.target.value})}
                  />
                </div>
                {(activeTool === 'caption' || activeTool === 'reel-script') && (
                  <div className="space-y-2">
                    <Label>Ton de la voix</Label>
                    <Input 
                      placeholder="Humoristique, Expert, etc." 
                      value={inputData.ton || ''} 
                      onChange={e => setInputData({...inputData, ton: e.target.value})}
                    />
                  </div>
                )}
                {activeTool === 'hashtags' && (
                  <div className="space-y-2">
                    <Label>Niche</Label>
                    <Input 
                      required 
                      placeholder="ex: Fitness" 
                      value={inputData.niche || ''} 
                      onChange={e => setInputData({...inputData, niche: e.target.value})}
                    />
                  </div>
                )}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto bg-primary">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Générer avec l'IA"}
              </Button>
            </form>

            {result && (
              <div className="mt-8 p-4 rounded-lg bg-background border border-border shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-primary">Résultat :</h4>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(result)}>
                    Copier
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm">{result}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
