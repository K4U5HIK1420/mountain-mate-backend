import React from "react";
import { cn } from "./cn";
import { Container } from "./Container";

export function Page({ className, children }) {
  return (
    <div className={cn("relative min-h-screen text-white", className)}>
      {children}
    </div>
  );
}

export function PageContent({ className, children }) {
  return (
    <Container className={cn("pt-32 pb-20", className)}>{children}</Container>
  );
}

