import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !(session as any).isAdmin) {
    redirect("/sign-in");
  }
  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-[#0F6E56] shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 17 C4 17 6 10 12 10 C18 10 20 4 20 4" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round"/>
              <path d="M20 4 L16 4 M20 4 L20 8" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="17" r="2.5" fill="#5DCAA5"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-medium tracking-tight leading-none">
              <span className="text-[var(--text-primary)]">grow</span>
              <span className="text-[#0F6E56]">via</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-normal">Admin Panel</span>
          </div>
          <div className="ml-3 px-2 py-0.5 bg-[#0F6E56]/10 border border-[#0F6E56]/20 rounded-full">
            <span className="text-[10px] font-bold text-[#0F6E56] uppercase tracking-wider">Admin</span>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--bg-surface-2)]">
            Logout
          </button>
        </form>
      </div>
      <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
