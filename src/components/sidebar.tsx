"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  Server,
  Building2,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { logoutAction } from "@/lib/auth-actions";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNav: NavItem[] = [
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Cluster", href: "/cluster", icon: Server },
];

const settingsNav: NavItem[] = [
  { label: "Organization", href: "/settings/organization", icon: Building2 },
  { label: "Account", href: "/settings/account", icon: User },
];

interface SidebarProps {
  userName: string;
  userEmail: string;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile overlay on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile overlay on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [mobileOpen, handleKeyDown]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // --- Shared sidebar content ---
  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const isCollapsed = !mobile && collapsed;

    return (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4",
            isCollapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-3.5 w-3.5 text-primary-foreground"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l-1.912 5.813a2 2 0 01-1.275 1.275L3 12l5.813 1.912a2 2 0 011.275 1.275L12 21l1.912-5.813a2 2 0 011.275-1.275L21 12l-5.813-1.912a2 2 0 01-1.275-1.275L12 3z" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
              Canopy
            </span>
          )}

          {/* Mobile close */}
          {mobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavSection
            label="Main"
            items={mainNav}
            isCollapsed={isCollapsed}
            isActive={isActive}
          />
          <div className="my-3" />
          <NavSection
            label="Settings"
            items={settingsNav}
            isCollapsed={isCollapsed}
            isActive={isActive}
          />
        </nav>

        {/* Footer: user info + collapse toggle */}
        <div className="shrink-0 border-t border-sidebar-border">
          {/* User row */}
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              isCollapsed && "justify-center px-0"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight text-sidebar-foreground">
                  {userName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Sign out"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          {/* Collapse toggle -- desktop only */}
          {!mobile && (
            <div className="flex items-center justify-center border-t border-sidebar-border py-2">
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile hamburger trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-3 z-40 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <PanelLeft className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background md:hidden">
            <SidebarContent mobile />
          </aside>
        </>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-sidebar-border bg-sidebar-background transition-[width] duration-200 ease-in-out md:flex md:flex-col",
          collapsed ? "w-[60px]" : "w-60"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Nav section                                                        */
/* ------------------------------------------------------------------ */

function NavSection({
  label,
  items,
  isCollapsed,
  isActive,
}: {
  label: string;
  items: NavItem[];
  isCollapsed: boolean;
  isActive: (href: string) => boolean;
}) {
  return (
    <div>
      {!isCollapsed && (
        <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  isCollapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
