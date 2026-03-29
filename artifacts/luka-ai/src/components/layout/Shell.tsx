import React from "react";
import { Link, useLocation } from "wouter";
import { GraduationCap, ScanText, MessageSquare, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/store/use-settings";

const NAV_ITEMS = [
  { href: "/search", label: "Professor Search", icon: GraduationCap },
  { href: "/ocr", label: "OCR Vision", icon: ScanText },
  { href: "/assistant", label: "LUKA Assistant", icon: MessageSquare },
  { href: "/history", label: "History/Export", icon: History },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { openSettings } = useSettings();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass-panel border-r-border z-10 relative">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <span className="font-display font-bold text-xl text-white">L</span>
            </div>
            <div>
              <div className="font-display font-bold text-base tracking-tight text-white leading-tight">Luka AI</div>
              <div className="text-[10px] text-cyan-400 font-medium tracking-widest uppercase">Master FI</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/search");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110 shrink-0", isActive && "text-primary")} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={openSettings}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-0 min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border glass-panel sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center">
              <span className="font-display font-bold text-white text-sm">L</span>
            </div>
            <div>
              <span className="font-display font-bold text-base text-white">Luka AI</span>
              <span className="text-[9px] text-cyan-400 font-medium tracking-widest uppercase ml-2">Master FI</span>
            </div>
          </div>
          <button onClick={openSettings} className="p-2 text-slate-400 hover:text-white">
            <Settings className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden glass-panel border-t-border pb-safe flex items-center justify-around p-2 sticky bottom-0 z-20">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (location === "/" && item.href === "/search");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center p-2 rounded-xl min-w-[60px] transition-colors",
                  isActive ? "text-primary" : "text-slate-400 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-medium leading-tight text-center">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
