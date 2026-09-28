"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type Option = { value: string; label: string; disabled?: boolean };

function optionsFromChildren(children: ReactNode): Option[] {
  const options: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(child)) {
      return;
    }
    if (typeof child.type === "string" && child.type !== "option") return;
    const value = child.props.value == null ? "" : String(child.props.value);
    const label =
      typeof child.props.children === "string" ||
      typeof child.props.children === "number"
        ? String(child.props.children)
        : value;
    options.push({
      value,
      label,
      disabled: Boolean(child.props.disabled),
    });
  });
  return options;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size"> {
  onChange?: (
    event: { target: { value: string; name?: string } },
  ) => void;
  placeholder?: string;
}

/**
 * Custom select — same children API as native `<select><option/></select>`,
 * so existing call sites keep working.
 */
export function Select({
  id,
  name,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  className,
  children,
  placeholder = "Select…",
  "aria-label": ariaLabel,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => optionsFromChildren(children), [children]);

  const isControlled = value !== undefined;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(
    String(defaultValue ?? value ?? ""),
  );

  const selectedValue = isControlled ? String(value ?? "") : internalValue;
  const selected = options.find((o) => o.value === selectedValue);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const commit = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.({ target: { value: next, name } });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onBlur={onBlur as never}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-left text-sm transition-colors",
          "focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20",
          disabled && "cursor-not-allowed opacity-50",
          open && "border-[var(--brand)] ring-2 ring-[var(--brand)]/20",
        )}
      >
        <span
          className={cn(
            "truncate",
            selected ? "text-[var(--ink)]" : "text-[var(--ink-subtle)]",
          )}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--ink-muted)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby={selectId}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[var(--border)] bg-white py-1 shadow-lg shadow-black/10"
        >
          {options.map((option) => {
            const active = option.value === selectedValue;
            return (
              <li key={`${option.value}-${option.label}`} role="option" aria-selected={active}>
                <button
                  type="button"
                  disabled={option.disabled}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                      : "text-[var(--ink)] hover:bg-[var(--surface-muted)]",
                    option.disabled && "cursor-not-allowed opacity-40",
                  )}
                  onClick={() => commit(option.value)}
                >
                  <span className="truncate">{option.label}</span>
                  {active ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
