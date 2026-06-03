"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LayoutDashboard, BarChart3, History, Settings, FileUp, MessageSquare, BrainCircuit, GraduationCap, FolderOpen, Video, Sun, Moon, Image } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Documents", href: "/dashboard/documents", icon: FolderOpen },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Studio AI", href: "/studio/image", icon: Image },
  { name: "Video Agent", href: "/studio/video", icon: Video },
  { name: "Quiz Generator", href: "/quiz", icon: BrainCircuit },
  { name: "Curriculum Builder", href: "/curriculum", icon: GraduationCap },
  { name: "Upload PDF", href: "/pdf-upload", icon: FileUp },
  { name: "PDF Chat", href: "/pdf-chat", icon: MessageSquare },
  { name: "History", href: "/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-full w-64 flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] transition-colors duration-200">
      {/* Growvia Logo Container */}
      <div className="flex flex-col justify-center px-6 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[#0F6E56] shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 17 C4 17 6 10 12 10 C18 10 20 4 20 4"
                stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round"/>
              <path d="M20 4 L16 4 M20 4 L20 8"
                stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="17" r="2.5" fill="#5DCAA5"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-medium tracking-tight">
              <span className="text-[var(--text-primary)]">grow</span>
              <span className="text-[#0F6E56]">via</span>
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-normal leading-tight">
              AI Growth Platform
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-[#E1F5EE] dark:bg-[rgba(15,110,86,0.15)] text-[#0F6E56] border-l-2 border-[#0F6E56] font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                  "group flex items-center rounded-md px-3 py-2.5 text-sm transition-colors duration-150"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-[#0F6E56]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
                    "mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-150"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Theme Toggle Button */}
      <div className="p-4 border-t border-[var(--border-color)]">
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              {resolvedTheme === "dark" ? (
                <>
                  <Sun className="h-5 w-5 text-amber-500 animate-spin-slow" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 text-[#534AB7]" />
                  <span>Dark Mode</span>
                </>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
