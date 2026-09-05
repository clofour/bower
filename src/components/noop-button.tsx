"use client";

import { Button } from "@/components/ui/button";
import type { ComponentPropsWithoutRef } from "react";

export function NoopButton({
  feature,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Button> & { feature: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      {...props}
      onClick={() =>
        alert(`${feature} is not yet available in this version of Bower.`)
      }
    >
      {children}
    </Button>
  );
}
