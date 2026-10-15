"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

export function MobileMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  return (
    <details
      ref={ref}
      className="menu"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !ref.current?.open) return;
        event.preventDefault();
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }}
    >
      {children}
    </details>
  );
}
