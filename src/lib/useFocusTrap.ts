"use client";

import { useEffect, useRef, useCallback, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Traps keyboard focus inside `containerRef` while `active` is true.
 *
 * - On activation, the previously focused element is saved and focus moves to
 *   the first focusable element inside the container (or the container itself
 *   if none exist).
 * - Tab / Shift+Tab cycle within the container.
 * - On deactivation, focus returns to the element that was focused before the
 *   trap activated.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  active: boolean,
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save the currently focused element when the trap activates.
  useEffect(() => {
    if (active) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    }
  }, [active]);

  // Focus the first element inside the container on activation.
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const raf = requestAnimationFrame(() => {
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        if (!container.hasAttribute("tabindex")) {
          container.setAttribute("tabindex", "-1");
        }
        container.focus();
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [active, containerRef]);

  // Intercept Tab / Shift+Tab to cycle within the container.
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements(container!);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container!.addEventListener("keydown", handleKeyDown);
    return () => container!.removeEventListener("keydown", handleKeyDown);
  }, [active, containerRef]);

  // Restore focus when the trap deactivates or the component unmounts.
  // The cleanup captures values from the render where the effect was created.
  // When active transitions true→false, cleanup runs with active=true and the
  // saved previousFocusRef, correctly restoring focus.
  useEffect(() => {
    return () => {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [active]);
}
