import { cn } from "@/lib/utils";

const palette: Record<string, string> = {
  healthy: "bg-emerald-500",
  running: "bg-emerald-500",
  ready: "bg-emerald-500",
  deploying: "bg-blue-500 animate-pulse",
  planning: "bg-blue-500 animate-pulse",
  pending: "bg-amber-500 animate-pulse",
  failed: "bg-red-500",
  lost: "bg-red-500",
  unhealthy: "bg-red-500",
  rolled_back: "bg-zinc-400 dark:bg-zinc-500",
  stopped: "bg-zinc-400 dark:bg-zinc-500",
  unknown: "bg-zinc-400 dark:bg-zinc-500",
};

export function Status({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          palette[value] ?? palette.unknown
        )}
      />
      {value.replace("_", " ")}
    </span>
  );
}
