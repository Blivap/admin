"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ClipboardList,
  Droplets,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-logout";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/requests", label: "Blood Requests", icon: Droplets },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/cms", label: "Content / CMS", icon: FileText },
  { href: "/analytics", label: "Analytics", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/audit", label: "Audit Log", icon: ClipboardList },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-white/65 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarChrome({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const { mutation: logoutMutation } = useLogout();

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-60 shrink-0 flex-col border-r border-white/10 bg-(--sidebar) text-(--sidebar-ink)",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-(--brand) text-white">
          <Droplets className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">Blivap Admin</p>
          <p className="text-[11px] text-white/50">Ops console</p>
        </div>
      </div>

      <NavLinks onNavigate={onNavigate} />

      <div className="border-t border-white/10 p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/70 hover:bg-white/5 hover:text-white"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          {logoutMutation.isPending ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex h-dvh overflow-hidden bg-(--background)">
      {/* Desktop sidebar */}
      <SidebarChrome className="hidden lg:flex" />

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <SidebarChrome
            className="relative z-10 shadow-2xl shadow-black/40"
            onNavigate={() => setOpen(false)}
          />
          <button
            type="button"
            aria-label="Close menu"
            className="absolute top-3 right-3 z-10 rounded-md bg-white/10 p-2 text-white backdrop-blur"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-(--border) bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            className="rounded-md border border-(--border) p-2 text-(--ink) hover:bg-(--surface-muted)"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-(--brand) text-white">
              <Droplets className="h-3.5 w-3.5" />
            </div>
            <p className="truncate text-sm font-semibold text-(--ink)">
              Blivap Admin
            </p>
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
