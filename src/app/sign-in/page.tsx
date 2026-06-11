"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An error occurred");
      }

      router.push(data.isAdmin ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] p-4 relative overflow-hidden transition-colors duration-200">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-[var(--border-color)] shadow-lg bg-[var(--bg-surface)] rounded-[16px] overflow-hidden">
          <CardHeader className="space-y-1 text-center pt-8 pb-4">
            {/* Centered Growvia Logo */}
            <div className="flex flex-col items-center gap-2 mb-4 justify-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[#0F6E56]">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 17 C4 17 6 10 12 10 C18 10 20 4 20 4"
                    stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 4 L16 4 M20 4 L20 8"
                    stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="17" r="2.5" fill="#5DCAA5"/>
                </svg>
              </div>
              <span className="text-xl font-medium tracking-tight mt-1">
                <span className="text-[var(--text-primary)]">grow</span>
                <span className="text-[#0F6E56]">via</span>
              </span>
            </div>
            <CardTitle className="text-2xl font-bold text-[var(--text-primary)]">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-[var(--text-secondary)]">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-[#0F6E56] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="bg-transparent border-[var(--border-color)] focus-visible:ring-[#0F6E56]/20 focus-visible:border-[#0F6E56] text-[var(--text-primary)]"
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] rounded-md border border-[var(--color-danger-main)]/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--color-danger-main)]" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white transition-colors duration-150 py-2.5 rounded-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-[#0F6E56] font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
