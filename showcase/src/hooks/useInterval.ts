import { useEffect, useRef } from "react";

/** setInterval that always calls the latest callback; pass null to pause. */
export function useInterval(callback: () => void, delayMs: number | null) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = window.setInterval(() => saved.current(), delayMs);
    return () => window.clearInterval(id);
  }, [delayMs]);
}
