"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

/** Routes the user between the desktop (`/`) and mobile (`/v2`) editors
 * based on the live viewport. Returns true once the match has been
 * checked on the client so callers can avoid rendering before we know
 * whether we'll redirect (prevents a flash of the wrong UI). */
export function useViewportRoute(currentVariant: "desktop" | "mobile"): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);

    const apply = (isMobile: boolean) => {
      if (currentVariant === "desktop" && isMobile) {
        router.replace("/v2");
        return false;
      }
      if (currentVariant === "mobile" && !isMobile) {
        router.replace("/");
        return false;
      }
      return true;
    };

    if (apply(mql.matches)) setReady(true);

    const onChange = (e: MediaQueryListEvent) => {
      apply(e.matches);
    };
    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
    };
  }, [currentVariant, router]);

  return ready;
}
