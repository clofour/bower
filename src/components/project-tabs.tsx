"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Services", segment: "" },
  { label: "Environments", segment: "/environments" },
  { label: "Deployments", segment: "/deployments" },
  { label: "Secrets", segment: "/secrets" },
  { label: "Routes", segment: "/routes" },
  { label: "Integrations", segment: "/integrations" },
  { label: "Settings", segment: "/settings" },
] as const;

export function ProjectTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/projects/${slug}`;

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1.5">
      {tabs.map(({ label, segment }) => {
        const href = `${base}${segment}`;
        const active =
          segment === ""
            ? pathname === base || pathname === `${base}/`
            : pathname.startsWith(href);

        return (
          <Link
            key={segment}
            href={href}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
