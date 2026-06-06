"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, BarChart3, History, Settings, FileUp, MessageSquare,
  BrainCircuit, GraduationCap, FolderOpen, Video, Sun, Moon, Image,
  BookOpen, Sparkles, ChevronDown, ChevronRight, Bot, Globe, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const topItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "My Documents", href: "/dashboard/documents", icon: FolderOpen },
];

const courseItems = [
  { name: "Course Settings", href: "/course/settings", icon: BookOpen },
  { name: "Upload PDF", href: "/course/upload-pdf", icon: FileUp },
  { name: "PDF Chat", href: "/course/pdf-chat", icon: MessageSquare },
  { name: "Quiz Generator", href: "/course/quiz", icon: BrainCircuit },
  { name: "Curriculum Builder", href: "/course/curriculum", icon: GraduationCap },
  { name: "Telegram Bot", href: "/course/telegram", icon: Bot },
  { name: "Student Questions", href: "/course/students", icon: Globe },
];

const studioItems = [
  { name: "Video Generation", href: "/studio/video", icon: Video },
  { name: "Image Generation", href: "/studio/image", icon: Image },
];

const bottomItems = [
  { name: "History", href: "/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [courseOpen, setCourseOpen] = useState(true);
  const [studioOpen, setStudioOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    const savedCourse = localStorage.getItem("sidebar-course-open");
    const savedStudio = localStorage.getItem("sidebar-studio-open");
    if (savedCourse !== null) setCourseOpen(savedCourse === "true");
    if (savedStudio !== null) setStudioOpen(savedStudio === "true");
  }, []);

  const toggleCourse = () => {
    const next = !courseOpen;
    setCourseOpen(next);
    localStorage.setItem("sidebar-course-open", String(next));
  };

  const toggleStudio = () => {
    const next = !studioOpen;
    setStudioOpen(next);
    localStorage.setItem("sidebar-studio-open", String(next));
  };

  const isCourseActive = courseItems.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
  const isStudioActive = studioItems.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

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
          {/* Top-level items */}
          {topItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  active
                    ? "bg-[#E1F5EE] dark:bg-[rgba(15,110,86,0.15)] text-[#0F6E56] border-l-2 border-[#0F6E56] font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                  "group flex items-center rounded-md px-3 py-2.5 text-sm transition-colors duration-150"
                )}
              >
                <item.icon
                  className={cn(
                    active ? "text-[#0F6E56]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
                    "mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-150"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}

          {/* My Course group */}
          <div className="pt-4">
            <button
              onClick={toggleCourse}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isCourseActive
                  ? "text-[#0F6E56]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-[#0F6E56]" />
                <span>My Course</span>
              </div>
              {courseOpen ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
            {courseOpen && (
              <div className="ml-1 mt-1 space-y-0.5 border-l-2 border-[#0F6E56]/20 pl-2">
                {courseItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        active
                          ? "bg-[#E1F5EE] dark:bg-[rgba(15,110,86,0.15)] text-[#0F6E56] font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                        "group flex items-center rounded-md px-3 py-2 text-sm transition-colors duration-150"
                      )}
                    >
                      <item.icon
                        className={cn(
                          active ? "text-[#0F6E56]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
                          "mr-3 flex-shrink-0 h-4 w-4 transition-colors duration-150"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Studio group */}
          <div className="pt-4">
            <button
              onClick={toggleStudio}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isStudioActive
                  ? "text-[#7F77DD]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#7F77DD]" />
                <span>AI Studio</span>
              </div>
              {studioOpen ? (
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 transition-transform duration-200" />
              )}
            </button>
            {studioOpen && (
              <div className="ml-1 mt-1 space-y-0.5 border-l-2 border-[#7F77DD]/20 pl-2">
                {studioItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        active
                          ? "bg-purple-500/10 text-[#7F77DD] font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                        "group flex items-center rounded-md px-3 py-2 text-sm transition-colors duration-150"
                      )}
                    >
                      <item.icon
                        className={cn(
                          active ? "text-[#7F77DD]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
                          "mr-3 flex-shrink-0 h-4 w-4 transition-colors duration-150"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom items */}
          <div className="pt-4">
            {bottomItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    active
                      ? "bg-[#E1F5EE] dark:bg-[rgba(15,110,86,0.15)] text-[#0F6E56] border-l-2 border-[#0F6E56] font-medium"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]",
                    "group flex items-center rounded-md px-3 py-2.5 text-sm transition-colors duration-150"
                  )}
                >
                  <item.icon
                    className={cn(
                      active ? "text-[#0F6E56]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]",
                      "mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-150"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
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
                  <Sun className="h-5 w-5 text-amber-500" />
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
