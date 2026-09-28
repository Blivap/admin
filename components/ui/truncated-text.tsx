"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * Single-line truncation with ellipsis.
 * Shows a hover popup with the full text only when content is actually clipped.
 */
export function TruncatedText({
  text,
  className,
  maxWidthClass = "max-w-[14rem]",
  as: Comp = "span",
}: {
  text?: string | null;
  className?: string;
  maxWidthClass?: string;
  as?: "span" | "p" | "button";
}) {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const value = (text ?? "").trim();
  const display = value || "—";

  const show = useCallback(() => {
    const el = ref.current;
    if (!el || !value) return;
    if (el.scrollWidth <= el.clientWidth + 1) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 16);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    setPos({ top: rect.bottom + 6, left });
    setOpen(true);
  }, [value]);

  const hide = useCallback(() => setOpen(false), []);

  return (
    <>
      <Comp
        ref={ref as never}
        className={cn("block truncate", maxWidthClass, className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {display}
      </Comp>
      {open && value
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[200] max-w-xs rounded-md border border-(--border) bg-(--ink) px-2.5 py-1.5 text-xs leading-relaxed text-white shadow-lg"
              style={{ top: pos.top, left: pos.left }}
            >
              {value}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
