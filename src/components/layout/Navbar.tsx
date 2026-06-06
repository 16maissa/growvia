"use client";

import { useState } from "react";
import { Bell, UserCircle, Search, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-4 shadow-sm sm:gap-x-6 sm:px-8 relative z-30 transition-colors duration-200">
      {/* Search */}
      <form className="relative flex flex-1 max-w-xs" action="#" method="GET">
        <label htmlFor="search-field" className="sr-only">Search</label>
        <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-4 text-muted-foreground" aria-hidden="true" />
        <input
          id="search-field"
          className="block h-full w-full border-0 bg-transparent py-0 pl-6 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm"
          placeholder="Search..."
          type="search"
          name="search"
        />
      </form>

      <div className="flex items-center gap-x-4 ml-auto">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <span className="sr-only">Notifications</span>
          <Bell className="h-5 w-5" />
        </Button>

        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

        {/* User menu */}
        <div className="relative">
          <button
            id="user-menu-btn"
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <UserCircle className="h-7 w-7" />
            <span className="hidden lg:block">My account</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 z-20 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-semibold truncate">Admin</p>
                </div>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {loggingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
