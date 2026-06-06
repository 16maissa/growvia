"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Moon, Menu, X, ArrowRight, Check, Star, Bot, Sparkles, Zap, 
  Search, Video, GraduationCap, ChevronRight, BarChart3, ShieldCheck, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LandingPageClientProps {
  isLoggedIn: boolean;
}

export function LandingPageClient({ isLoggedIn }: LandingPageClientProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"audit" | "studio" | "chat">("audit");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Smooth scroll helper
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  // SVG Logo component
  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-[#0F6E56] shrink-0">
        <svg viewBox="0 0 24 24" fill="none" className="w-5.5 h-5.5" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 17 C4 17 6 10 12 10 C18 10 20 4 20 4"
            stroke="#9FE1CB" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M20 4 L16 4 M20 4 L20 8"
            stroke="#9FE1CB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="17" r="2.5" fill="#5DCAA5"/>
        </svg>
      </div>
      <span className="text-lg font-medium tracking-tight">
        <span className="text-[var(--text-primary)]">grow</span>
        <span className="text-[#0F6E56]">via</span>
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans relative overflow-x-hidden transition-colors duration-200">
      
      {/* Decorative Gradient Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0F6E56]/10 dark:bg-[#0F6E56]/5 blur-3xl pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#7F77DD]/10 dark:bg-[#7F77DD]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-[#5DCAA5]/8 dark:bg-[#5DCAA5]/4 blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(44,44,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,44,42,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(241,245,249,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(241,245,249,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-surface)]/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" onClick={(e) => handleScroll(e, "features")} className="text-sm text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors font-medium">Features</a>
            <a href="#benefits" onClick={(e) => handleScroll(e, "benefits")} className="text-sm text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors font-medium">Benefits</a>
            <a href="#pricing" onClick={(e) => handleScroll(e, "pricing")} className="text-sm text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors font-medium">Pricing</a>
            <a href="#testimonials" onClick={(e) => handleScroll(e, "testimonials")} className="text-sm text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors font-medium">Testimonials</a>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
              >
                {resolvedTheme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-[#534AB7]" />}
              </Button>
            )}

            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="bg-[#0F6E56] hover:bg-[#085041] text-white px-4 h-9 rounded-lg flex items-center gap-1.5 shadow-sm font-semibold transition-all">
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] h-9 px-4 rounded-lg font-medium transition-colors">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-[#0F6E56] hover:bg-[#085041] text-white h-9 px-4 rounded-lg font-semibold shadow-sm transition-all hover:shadow-md">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg"
              >
                {resolvedTheme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-[#534AB7]" />}
              </Button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[var(--text-primary)] p-2 hover:bg-[var(--bg-surface-2)] rounded-lg transition-colors focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-300 z-30"
          >
            <div className="px-4 pt-2 pb-6 space-y-3 flex flex-col">
              <a href="#features" onClick={(e) => handleScroll(e, "features")} className="px-3 py-2 text-base text-[var(--text-secondary)] hover:text-[#0F6E56] hover:bg-[var(--bg-surface-2)] rounded-lg transition-colors font-medium">Features</a>
              <a href="#benefits" onClick={(e) => handleScroll(e, "benefits")} className="px-3 py-2 text-base text-[var(--text-secondary)] hover:text-[#0F6E56] hover:bg-[var(--bg-surface-2)] rounded-lg transition-colors font-medium">Benefits</a>
              <a href="#pricing" onClick={(e) => handleScroll(e, "pricing")} className="px-3 py-2 text-base text-[var(--text-secondary)] hover:text-[#0F6E56] hover:bg-[var(--bg-surface-2)] rounded-lg transition-colors font-medium">Pricing</a>
              <a href="#testimonials" onClick={(e) => handleScroll(e, "testimonials")} className="px-3 py-2 text-base text-[var(--text-secondary)] hover:text-[#0F6E56] hover:bg-[var(--bg-surface-2)] rounded-lg transition-colors font-medium">Testimonials</a>
              
              <div className="pt-4 border-t border-[var(--border-color)] flex flex-col gap-3">
                {isLoggedIn ? (
                  <Link href="/dashboard" className="w-full">
                    <Button className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-sm">
                      Dashboard <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-in" className="w-full">
                      <Button variant="ghost" className="w-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] py-2.5 rounded-lg font-medium transition-colors">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up" className="w-full">
                      <Button className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white py-2.5 rounded-lg font-semibold shadow-sm">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HERO SECTION */}
      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Column */}
          <motion.div 
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
            initial="hidden"
            animate="visible"
            variants={fadeInUpVariants}
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 text-xs font-semibold text-[#0F6E56] tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#5DCAA5]" />
              <span>The Next-Gen AI Audience Accelerator</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-[var(--text-primary)] leading-[1.1] font-sans">
              Scale Your Audience <br />
              <span className="font-[family-name:var(--font-playfair)] font-normal italic text-[#0F6E56] dark:text-[#5DCAA5]">
                on Autopilot
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Growvia coordinates autonomous AI agents to audit your social profiles, draft viral media, build course materials, and handle community questions 24/7.
            </p>

            {/* Call To Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#0F6E56] hover:bg-[#085041] text-white px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl font-semibold transition-all flex items-center justify-center gap-2 group">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full sm:w-auto hover:bg-[var(--bg-surface-2)] text-[var(--text-primary)] px-8 py-6 text-base rounded-full border-[var(--border-color)] font-medium transition-all">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Mini metrics tag */}
            <div className="pt-6 flex flex-wrap justify-center lg:justify-start items-center gap-x-6 gap-y-2 text-sm text-[var(--text-muted)]">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  <span className="w-5 h-5 rounded-full bg-teal-500 border-2 border-[var(--bg-page)] text-[7px] text-white flex items-center justify-center font-bold">A</span>
                  <span className="w-5 h-5 rounded-full bg-purple-500 border-2 border-[var(--bg-page)] text-[7px] text-white flex items-center justify-center font-bold">B</span>
                  <span className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-[var(--bg-page)] text-[7px] text-white flex items-center justify-center font-bold">C</span>
                </div>
                <span>Trusted by 12,000+ creators</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-[var(--border-color)]" />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="font-semibold text-[var(--text-primary)]">4.8/5 rating</span>
              </div>
            </div>
          </motion.div>

          {/* Right Dashboard Mockup Column */}
          <motion.div 
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Glowing Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F6E56]/10 to-[#7F77DD]/10 rounded-2xl blur-xl" />

            {/* Mockup Container */}
            <div className="relative border border-[var(--border-color)] rounded-2xl bg-[var(--bg-surface)] shadow-2xl p-4 md:p-6 overflow-hidden transition-all duration-300">
              
              {/* Fake Browser Chrome */}
              <div className="flex items-center gap-1.5 pb-4 mb-4 border-b border-[var(--border-color)]">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-[10px] text-[var(--text-muted)] font-mono ml-2 font-medium">app.growvia.io/dashboard</span>
              </div>

              {/* Mock Dashboard Widgets */}
              <div className="space-y-4">
                {/* Header widget */}
                <div className="flex justify-between items-center bg-[var(--bg-surface-2)] p-3 rounded-xl">
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Active Analysis</p>
                    <p className="text-sm font-bold mt-0.5 text-[var(--text-primary)]">@social_creator</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#0F6E56] text-[10px] font-bold">
                    Connected
                  </span>
                </div>

                {/* Main Graph Widget */}
                <div className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-surface)]">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] font-medium">Estimated Audience Growth</p>
                      <p className="text-xl font-black text-[var(--text-primary)]">+24.5% <span className="text-xs font-semibold text-emerald-500">vs last week</span></p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-[#0F6E56]" />
                  </div>
                  {/* Clean SVG Graph */}
                  <svg className="w-full h-24 text-[#0F6E56] overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0F6E56" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0F6E56" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path d="M 0 30 L 0 25 Q 15 22 25 18 T 50 14 T 75 8 T 100 2 L 100 30 Z" fill="url(#chartGlow)" />
                    {/* Graph line */}
                    <path d="M 0 25 Q 15 22 25 18 T 50 14 T 75 8 T 100 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    {/* Circles on peaks */}
                    <circle cx="50" cy="14" r="1.5" className="fill-[#0F6E56] stroke-white dark:stroke-slate-900 stroke-2" />
                    <circle cx="100" cy="2" r="1.5" className="fill-[#5DCAA5] stroke-white dark:stroke-slate-900 stroke-2 animate-ping" />
                  </svg>
                </div>

                {/* Sub widgets split grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Left */}
                  <div className="border border-[var(--border-color)] rounded-xl p-3 bg-[var(--bg-surface)] flex flex-col justify-between">
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">Daily AI Tasks</span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-2 h-2 rounded-full bg-[#7F77DD] animate-pulse" />
                      <span className="text-xs font-bold">Autopilot Mode</span>
                    </div>
                  </div>
                  {/* Right */}
                  <div className="border border-[var(--border-color)] rounded-xl p-3 bg-[var(--bg-surface)] flex flex-col justify-between">
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">Engagement Health</span>
                    <span className="text-xs font-bold text-[#0F6E56] mt-2">Excellent (94)</span>
                  </div>
                </div>

                {/* Running Task ticker */}
                <div className="border border-[var(--border-color)] p-2.5 rounded-xl flex items-center justify-between text-xs bg-[var(--bg-surface-2)]">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#7F77DD]" />
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">Agent drafting viral hook...</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7F77DD]" />
                </div>

              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="py-20 md:py-28 border-t border-[var(--border-color)] bg-[var(--bg-surface)]/45 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F6E56]">Core Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Everything you need to automate growth
            </h3>
            <p className="text-base sm:text-lg text-[var(--text-secondary)]">
              Discover how our intelligent assistants and specialized tools work together to scale your social footprint and audience.
            </p>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex justify-center gap-2 md:gap-4 mb-12">
            {[
              { id: "audit", label: "AI Profile Audit", icon: Search },
              { id: "studio", label: "AI Creative Studio", icon: Video },
              { id: "chat", label: "Learning Assistant", icon: GraduationCap }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                    isActive
                      ? "bg-[#0F6E56] text-white border-transparent shadow-md"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feature Display Card with Animations */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="border border-[var(--border-color)] rounded-2xl bg-[var(--bg-surface)] shadow-xl p-6 md:p-10"
            >
              {activeTab === "audit" && (
                <div className="grid md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-7 space-y-6">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                      <Search className="w-5 h-5 text-[#0F6E56]" />
                    </div>
                    <h4 className="text-2xl font-bold">Deep AI Instagram Profile Audit</h4>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      Enter your Instagram handle and let our system execute a deep audit. Our AI agents parse past engagement, classify audience sentiment, detect performance bottlenecks, and generate a customized 90-day action playbook with specific post hooks and daily tasks.
                    </p>
                    <ul className="space-y-2.5">
                      {["Extract client frustrations and business opportunities", "Automatic 90-day roadmap with specific daily guidelines", "Real-time updates as your profile metrics change"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Check className="w-4 h-4 text-[#0F6E56] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2">
                      <Link href="/sign-up">
                        <Button className="bg-[#0F6E56] hover:bg-[#085041] text-white rounded-lg flex items-center gap-1">
                          Run Free Audit <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="md:col-span-5 bg-[var(--bg-page)] rounded-xl p-6 border border-[var(--border-color)] space-y-4">
                    <p className="text-xs font-bold text-[#0F6E56] uppercase tracking-wide">Audit Parameters</p>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                        <span className="text-[var(--text-muted)]">Niche Analysis</span>
                        <span className="font-semibold">Fitness / Tech / Creator</span>
                      </div>
                      <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                        <span className="text-[var(--text-muted)]">Engagement Target</span>
                        <span className="font-semibold">High-quality qualified leads</span>
                      </div>
                      <div className="flex justify-between border-b border-[var(--border-color)] pb-2">
                        <span className="text-[var(--text-muted)]">Action Plan Span</span>
                        <span className="font-semibold">90 Days (Weekly breakdown)</span>
                      </div>
                    </div>
                    {/* Tiny audit mock preview */}
                    <div className="p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-color)] text-xs space-y-1">
                      <span className="font-bold text-[#0F6E56]">💡 AI Recommendation:</span>
                      <p className="text-[var(--text-secondary)]">"Your core audience shows highest frustration regarding workout plan clarity. Focus your next 3 reels on simple checklist content."</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "studio" && (
                <div className="grid md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-7 space-y-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Video className="w-5 h-5 text-[#7F77DD]" />
                    </div>
                    <h4 className="text-2xl font-bold">AI Video & Image Creation Studio</h4>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      Scale your asset pipeline using the integrated studio tools. Generate high-quality visual contents and post scripts tailored to your target audience. Review the automatic media drafts and push them straight to your publishing calendar.
                    </p>
                    <ul className="space-y-2.5">
                      {["Automated video scripts with engagement anchors", "Social graphic designs adjusted to your color branding", "Simple calendar approval system for draft posts"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Check className="w-4 h-4 text-[#0F6E56] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2">
                      <Link href="/sign-up">
                        <Button className="bg-[#0F6E56] hover:bg-[#085041] text-white rounded-lg flex items-center gap-1">
                          Open AI Studio <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="md:col-span-5 bg-[var(--bg-page)] rounded-xl p-6 border border-[var(--border-color)] flex flex-col justify-center items-center text-center">
                    <Sparkles className="w-12 h-12 text-[#7F77DD] mb-3 animate-pulse" />
                    <span className="text-sm font-bold">Asset Generator Draft</span>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Click below to render visual mocks</p>
                    <div className="w-full h-32 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col justify-center items-center p-3 relative overflow-hidden">
                      <div className="absolute top-2 left-2 bg-[#7F77DD]/15 text-[#7F77DD] px-1.5 py-0.5 rounded text-[9px] font-bold">Instagram Reel</div>
                      <p className="text-[10px] font-semibold mt-4 text-[var(--text-secondary)]">"The 3 fitness mistakes keeping you weak..."</p>
                      <span className="text-[9px] text-[var(--text-muted)] mt-2">Duration: 15s • Ratio: 9:16</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "chat" && (
                <div className="grid md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-7 space-y-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h4 className="text-2xl font-bold">PDF Chat & Automated Learning Hub</h4>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      Upload course slides, training materials, or audience booklets and turn them into interactive portals. Chat with documents to extract information, auto-generate student practice quizzes, and build comprehensive curriculums with AI.
                    </p>
                    <ul className="space-y-2.5">
                      {["Direct document chat assistant with precise citations", "One-click generation of multiple choice quizzes", "Auto-curriculum mapping for courses and academies"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Check className="w-4 h-4 text-[#0F6E56] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2">
                      <Link href="/sign-up">
                        <Button className="bg-[#0F6E56] hover:bg-[#085041] text-white rounded-lg flex items-center gap-1">
                          Try Chat Assistant <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="md:col-span-5 bg-[var(--bg-page)] rounded-xl p-5 border border-[var(--border-color)] space-y-3">
                    <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold">course-syllabus.pdf</span>
                    </div>
                    {/* Chat Bubble Simulation */}
                    <div className="space-y-2.5 max-h-48 overflow-y-auto text-xs">
                      <div className="p-2 bg-[var(--bg-surface-2)] rounded-lg max-w-[85%] self-start">
                        <p className="text-[11px] text-[var(--text-secondary)] font-semibold">Student</p>
                        <p className="text-[11px]">Can you summarize the core modules in section 2?</p>
                      </div>
                      <div className="p-2 bg-[#0F6E56]/10 text-[var(--text-primary)] rounded-lg max-w-[85%] ml-auto">
                        <p className="text-[11px] text-[#0F6E56] font-semibold">Growvia AI</p>
                        <p className="text-[11px]">Section 2 focuses on client conversion tactics, specifically establishing authority hooks and pricing structures (page 12).</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Autopilot Callout Grid */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)] p-6 flex gap-4 items-start hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-[#0F6E56]" />
              </div>
              <div>
                <h5 className="font-bold text-base text-[var(--text-primary)]">Autopilot Agent Engine</h5>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Connect your channels and let our specialized agents execute tasks automatically after brief dashboard reviews. Safe, secure, and controlled.
                </p>
              </div>
            </div>

            <div className="border border-[var(--border-color)] rounded-xl bg-[var(--bg-surface)] p-6 flex gap-4 items-start hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#7F77DD]" />
              </div>
              <div>
                <h5 className="font-bold text-base text-[var(--text-primary)]">Quick AI Tools Access</h5>
                <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                  Need a single task completed? Use standalone generators for quiz prep, video captioning, or curriculum reviews in seconds.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. BENEFITS SECTION */}
      <section id="benefits" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[var(--border-color)]">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text and Graphic */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F6E56]">Why Growvia</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Built for modern creators & educators
            </h3>
            <p className="text-base text-[var(--text-secondary)] leading-relaxed">
              Traditional tools force you to work inside multiple tabs and write manual prompts. Growvia connects your context directly to our active execution agents.
            </p>
            {/* Visual list checkmarks */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-[#0F6E56] font-bold text-xs shrink-0">1</div>
                <div>
                  <h5 className="text-sm font-bold">Consolidated Dashboard</h5>
                  <p className="text-xs text-[var(--text-secondary)]">Replace 4 individual subscriptions with a single platform.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-[#7F77DD] font-bold text-xs shrink-0">2</div>
                <div>
                  <h5 className="text-sm font-bold">1-Click Content Verification</h5>
                  <p className="text-xs text-[var(--text-secondary)]">You approve our agents' drafts before anything goes live.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Benefits Grid (2x2) */}
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
            
            {/* Benefit Card 1 */}
            <Card className="bg-[var(--bg-surface)] border-[var(--border-color)] rounded-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#0F6E56]">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-lg">Save Hours Weekly</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Let AI handle manual syllabus outlines, video scripts, and metric logs. Spend your time where it counts: interacting with your community.
                </p>
              </CardContent>
            </Card>

            {/* Benefit Card 2 */}
            <Card className="bg-[var(--bg-surface)] border-[var(--border-color)] rounded-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-[#7F77DD]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-lg">Precise AI Alignment</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Our systems map out specific objectives according to your niche, audience profile, and price range. No generic AI templates.
                </p>
              </CardContent>
            </Card>

            {/* Benefit Card 3 */}
            <Card className="bg-[var(--bg-surface)] border-[var(--border-color)] rounded-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[#0F6E56]">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-lg">Continuous Autonomy</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Once configured, our agents operate in the background, keeping track of tasks and queueing draft content for your convenience.
                </p>
              </CardContent>
            </Card>

            {/* Benefit Card 4 */}
            <Card className="bg-[var(--bg-surface)] border-[var(--border-color)] rounded-xl hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-[#7F77DD]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-lg">Audience Engagement</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Solve queries directly from chat interfaces. Boost loyalty by letting the automated bot answer standard questions instantly.
                </p>
              </CardContent>
            </Card>

          </div>

        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="pricing" className="py-20 md:py-28 border-t border-[var(--border-color)] bg-[var(--bg-surface)]/30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-4 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F6E56]">Pricing</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              Plans built for every creator profile
            </h3>
            <p className="text-base sm:text-lg text-[var(--text-secondary)]">
              Whether you are a beginner creator, educator, or agency — Growvia has the right plan for you. Change or cancel anytime.
            </p>
          </div>

          {/* Currency note */}
          <p className="text-center text-xs text-[var(--text-muted)] mb-12">
            All prices are in <span className="font-semibold text-[var(--text-secondary)]">Algerian Dinar (DZD)</span> · Billed monthly · No commitment
          </p>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Free Plan */}
            <div className="border border-[var(--border-color)] rounded-2xl bg-[var(--bg-surface)] p-8 flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Starter</div>
                  <h4 className="text-xl font-bold">Free</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Try the AI tools with no commitment.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">0</span>
                  <span className="text-lg font-bold text-[var(--text-muted)]">DA</span>
                  <span className="text-sm text-[var(--text-muted)] ml-1">/ forever</span>
                </div>
                <ul className="space-y-3 text-xs text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-5">
                  {["5 free AI generations included", "Access to standalone AI tools (quiz, image, video)", "Basic PDF analysis (1 file)", "No full profile audit", "Community support"].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#0F6E56] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link href="/sign-up" className="w-full block">
                  <Button variant="ghost" className="w-full bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-2)]/80 py-2.5 rounded-xl font-semibold">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Growth Plan — RECOMMENDED */}
            <div className="border-2 border-[#0F6E56] rounded-2xl bg-[var(--bg-surface)] p-8 flex flex-col justify-between shadow-xl relative scale-100 md:scale-105 z-10">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#0F6E56] text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                ⭐ Recommended
              </div>
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-bold text-[#0F6E56] uppercase tracking-wider mb-3">Growth</div>
                  <h4 className="text-xl font-bold">Growth Plan</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">For creators & educators who want to scale up.</p>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">1,900</span>
                    <span className="text-lg font-bold text-[var(--text-muted)]">DA</span>
                    <span className="text-sm text-[var(--text-muted)] ml-1">/ month</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">≈ 13€ · Save 20% with an annual subscription</p>
                </div>
                <ul className="space-y-3 text-xs text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-5">
                  {[
                    { text: "Full AI Instagram profile audit", highlight: true },
                    { text: "Custom 90-day action plan", highlight: true },
                    { text: "Unlimited generations (images, videos, scripts)", highlight: false },
                    { text: "PDF Chat + AI quiz generator", highlight: false },
                    { text: "AI curriculum builder", highlight: false },
                    { text: "Integrated Telegram bot", highlight: false },
                    { text: "Priority support", highlight: false },
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#0F6E56] shrink-0 mt-0.5" />
                      <span className={feat.highlight ? "font-semibold text-[var(--text-primary)]" : ""}>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link href="/sign-up" className="w-full block">
                  <Button className="w-full bg-[#0F6E56] hover:bg-[#085041] text-white py-2.5 rounded-xl font-semibold shadow-md">
                    Start Growth Plan
                  </Button>
                </Link>
              </div>
            </div>

            {/* Autopilot Plan */}
            <div className="border border-[var(--border-color)] rounded-2xl bg-[var(--bg-surface)] p-8 flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/10 text-[10px] font-bold text-[#7F77DD] uppercase tracking-wider mb-3">Agency / Pro</div>
                  <h4 className="text-xl font-bold">Autopilot Plan</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">For agencies & brands that automate everything.</p>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">4,500</span>
                    <span className="text-lg font-bold text-[var(--text-muted)]">DA</span>
                    <span className="text-sm text-[var(--text-muted)] ml-1">/ month</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">≈ 31€ · Manage up to 5 Instagram accounts</p>
                </div>
                <ul className="space-y-3 text-xs text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-5">
                  {[
                    "Everything in Growth Plan included",
                    "Autonomous agents (scheduled posting via n8n)",
                    "1-click validation from the dashboard",
                    "Telegram bot for automated question replies",
                    "24/7 automated community responses",
                    "Multi-account support (up to 5 profiles)",
                    "Dedicated support + personalized onboarding",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#0F6E56] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8">
                <Link href="/sign-up" className="w-full block">
                  <Button variant="ghost" className="w-full bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-surface-2)]/80 py-2.5 rounded-xl font-semibold">
                    Upgrade to Autopilot
                  </Button>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. SOCIAL PROOF SECTION */}
      <section id="testimonials" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[var(--border-color)]">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F6E56]">Social Proof</h2>
          <h3 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Trusted by creators and educators worldwide
          </h3>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-16">
          <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
            <p className="text-3xl sm:text-4xl font-extrabold text-[#0F6E56]">150,000+</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">Generations Completed</p>
          </div>
          <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
            <p className="text-3xl sm:text-4xl font-extrabold text-[#7F77DD]">12,400+</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">Active Creators</p>
          </div>
          <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
            <p className="text-3xl sm:text-4xl font-extrabold text-[#0F6E56]">4.8/5</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">Average User Rating</p>
          </div>
          <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] shadow-sm">
            <p className="text-3xl sm:text-4xl font-extrabold text-[#7F77DD]">4x</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">Average Growth Rate</p>
          </div>
        </div>

        {/* Testimonials Carousel/Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Testimonial 1 */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
            <div className="space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                "Growvia completely transformed my content flow. The 90-day action plan took my Instagram handle from 2k to 15k followers in weeks. The daily recommendations are extremely targeted."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-6 border-t border-[var(--border-color)] mt-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0F6E56] to-[#9FE1CB] flex items-center justify-center text-white text-xs font-bold">
                SK
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Sarah K.</p>
                <p className="text-[10px] text-[var(--text-muted)]">Fitness Influencer</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
            <div className="space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                "Using the PDF Chat and Quiz Generator saved me 15 hours a week in preparing curriculum materials. The student questions chatbot is a lifesaver for student support."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-6 border-t border-[var(--border-color)] mt-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7F77DD] to-[#CECBF6] flex items-center justify-center text-white text-xs font-bold">
                AD
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Prof. Alexandre D.</p>
                <p className="text-[10px] text-[var(--text-muted)]">Academy Educator</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 rounded-2xl flex flex-col justify-between shadow-sm relative">
            <div className="space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                "The Autopilot mode is insane. I just review the drafts once a day and the agent handles scheduling and student comments. It operates 24/7 in the background."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-6 border-t border-[var(--border-color)] mt-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5DCAA5] to-[#EEEDFE] flex items-center justify-center text-white text-xs font-bold">
                MT
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Marcus T.</p>
                <p className="text-[10px] text-[var(--text-muted)]">Digital Agency Founder</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. FINAL CTA SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
        <motion.div 
          className="relative border border-[var(--border-color)] rounded-3xl bg-gradient-to-tr from-[#0F6E56]/15 via-[var(--bg-surface)] to-[#7F77DD]/15 p-8 md:p-14 text-center overflow-hidden shadow-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUpVariants}
        >
          {/* Backdrop orbs */}
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-[#0F6E56]/10 blur-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-44 h-44 rounded-full bg-[#7F77DD]/10 blur-xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Ready to accelerate your brand's growth?
            </h3>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              Create your Growvia account today. Launch your first profile audit, draft high-converting scripts, and let AI agents handle the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <Button className="bg-[#0F6E56] hover:bg-[#085041] text-white px-8 py-6 text-base rounded-full shadow-xl hover:shadow-2xl transition-all font-semibold flex items-center gap-2 group">
                  Sign Up for Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-[var(--text-muted)]">No credit card required • 5 free generations included</p>
          </div>
        </motion.div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)] py-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            
            {/* Column 1 - Brand Info */}
            <div className="col-span-2 space-y-4">
              <Logo />
              <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
                Growvia is an all-in-one AI growth platform for social creators, brands, and digital academies.
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                © {new Date().getFullYear()} Growvia. All rights reserved.
              </p>
            </div>

            {/* Column 2 - Product */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Product</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" onClick={(e) => handleScroll(e, "features")} className="text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors">Features</a></li>
                <li><a href="#pricing" onClick={(e) => handleScroll(e, "pricing")} className="text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors">Pricing</a></li>
                <li><Link href="/sign-in" className="text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors">Tool Dashboard</Link></li>
              </ul>
            </div>

            {/* Column 3 - Auth */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Account</h5>
              <ul className="space-y-2 text-xs">
                <li><Link href="/sign-in" className="text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors">Sign In</Link></li>
                <li><Link href="/sign-up" className="text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors">Sign Up</Link></li>
                <li><Link href="/setup" className="text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors">Setup Wizard</Link></li>
              </ul>
            </div>

            {/* Column 4 - Company */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Legal</h5>
              <ul className="space-y-2 text-xs">
                <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-[var(--text-secondary)] hover:text-[#0F6E56] transition-colors">Terms of Service</Link></li>
                <li>
                  <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                    Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by Antigravity
                  </span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
