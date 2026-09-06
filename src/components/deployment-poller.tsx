"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DeploymentPoller({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [active, router]);

  return null;
}
