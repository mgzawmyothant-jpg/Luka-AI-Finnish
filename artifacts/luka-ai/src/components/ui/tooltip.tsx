import React from "react";

// Minimal tooltip provider to satisfy App.tsx imports without bringing in Radix complexity
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
