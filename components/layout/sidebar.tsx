"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  Droplets,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/users", label: "Users", icon: Users },
  { href: "/requests", label: "Blood Requests", icon: Droplets },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      router.replace("/login");
      router.refresh();
    },
  });

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] text-[var(--sidebar-ink)]">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand)] text-white">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">Blivap Admin</p>
          <p className="text-[11px] text-white/50">Donor matching ops</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
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
