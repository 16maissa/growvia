"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Zap, Bot, ArrowRight, Loader2 } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // Simule un paiement réussi → appel API pour changer le plan
    const res = await fetch("/api/automation/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "croissance", mode: "semi_auto" }),
    });
    if (res.ok) {
      // Force full page reload to refresh JWT cookie
      window.location.href = "/analytics";
    } else {
      setLoading(false);
    }
  };

  const features = [
    "90-day AI content plan",
    "Error detection & recommendations",
    "One-click content generation",
    "Reel, image & quiz creation",
    "Auto-scheduling (coming soon)",
    "Priority support",
  ];

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 space-y-10">
      <div className="text-center space-y-3">
        <Badge className="bg-[#0F6E56]/10 text-[#0F6E56] border-[#0F6E56]/20">Upgrade</Badge>
        <h1 className="text-4xl font-black text-[var(--text-primary)]">Choose your plan</h1>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          Unlock the full power of Growvia with Semi-Auto mode.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free */}
        <Card className="border-[var(--border-color)] bg-[var(--bg-surface)] rounded-2xl opacity-70">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-[var(--text-muted)]" />
              <CardTitle className="text-lg">Free</CardTitle>
            </div>
            <CardDescription>Current plan</CardDescription>
            <p className="text-4xl font-black text-[var(--text-primary)] mt-2">$0<span className="text-base font-normal text-[var(--text-muted)]">/mo</span></p>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Basic stats & overview", "1 free analysis", "Manual content tools"].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)]" />{f}
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4" disabled>Current plan</Button>
          </CardContent>
        </Card>

        {/* Semi-Auto */}
        <Card className="border-[#0F6E56] bg-gradient-to-br from-[#0F6E56]/5 to-transparent rounded-2xl relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Badge className="bg-[#0F6E56] text-white border-0">Most Popular</Badge>
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-[#0F6E56]" />
              <CardTitle className="text-lg">Semi-Auto</CardTitle>
            </div>
            <CardDescription>Everything you need to grow</CardDescription>
            <p className="text-4xl font-black text-[#0F6E56] mt-2">$29<span className="text-base font-normal text-[var(--text-muted)]">/mo</span></p>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <CheckCircle2 className="w-4 h-4 text-[#0F6E56]" />{f}
              </div>
            ))}
            <Button
              className="w-full mt-4 bg-[#0F6E56] hover:bg-[#085041] text-white rounded-lg gap-2"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</> : <>Get Semi-Auto <ArrowRight className="w-4 h-4" /></>}
            </Button>
            <p className="text-xs text-center text-[var(--text-muted)] mt-2">
              🧪 Test mode — no real payment required
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
