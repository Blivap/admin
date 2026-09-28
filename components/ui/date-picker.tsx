"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DatePickerProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "defaultValue"
> {
  value?: string;
  defaultValue?: string;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
  /** Include time (`HH:mm`) — value becomes `YYYY-MM-DDTHH:mm`. */
  includeTime?: boolean;
}

function parseValue(value: string | undefined, includeTime: boolean) {
  if (!value) return { date: null as Date | null, time: "00:00" };
  try {
    if (includeTime && value.includes("T")) {
      const [datePart, timePart = "00:00"] = value.split("T");
      return {
        date: datePart ? parseISO(datePart) : null,
        time: timePart.slice(0, 5),
      };
    }
    return { date: parseISO(value), time: "00:00" };
  } catch {
    return { date: null, time: "00:00" };
  }
}

function toValue(date: Date, time: string, includeTime: boolean) {
  const day = format(date, "yyyy-MM-dd");
  return includeTime ? `${day}T${time}` : day;
}

export function DatePicker({
  id,
  name,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled,
  className,
  placeholder = "Pick a date",
  includeTime = false,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const generatedId = useId();
  const pickerId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);

  const isControlled = value !== undefined;
  const initial = parseValue(String(value ?? defaultValue ?? ""), includeTime);

  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(
    String(value ?? defaultValue ?? ""),
  );
  const [cursorMonth, setCursorMonth] = useState<Date>(
    initial.date && !Number.isNaN(initial.date.getTime())
      ? startOfMonth(initial.date)
      : startOfMonth(new Date()),
  );
  const [time, setTime] = useState(initial.time);

  const currentValue = isControlled ? String(value ?? "") : internalValue;
  const selected = parseValue(currentValue, includeTime).date;
  const selectedValid =
    selected && !Number.isNaN(selected.getTime()) ? selected : null;

  useEffect(() => {
    if (!isControlled) return;
    const parsed = parseValue(String(value ?? ""), includeTime);
    if (parsed.date && !Number.isNaN(parsed.date.getTime())) {
      setCursorMonth(startOfMonth(parsed.date));
      setTime(parsed.time);
    }
  }, [value, includeTime, isControlled]);

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

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursorMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursorMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursorMonth]);

  const commit = (date: Date, nextTime = time) => {
    const next = toValue(date, nextTime, includeTime);
    if (!isControlled) setInternalValue(next);
    onChange?.({ target: { value: next, name } });
    if (!includeTime) setOpen(false);
  };

  const displayLabel = selectedValid
    ? includeTime
      ? format(selectedValid, "dd MMM yyyy") + ` · ${time}`
      : format(selectedValid, "dd MMM yyyy")
    : placeholder;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        id={pickerId}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onBlur={onBlur as never}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-(--border) bg-white px-3 text-left text-base transition-colors",
          "focus:border-(--brand) focus:outline-none focus:ring-2 focus:ring-(--brand)/20",
          disabled && "cursor-not-allowed opacity-50",
          open && "border-(--brand) ring-2 ring-(--brand)/20",
        )}
      >
        <span
          className={cn(
            "truncate",
            selectedValid ? "text-(--ink)" : "text-(--ink-subtle)",
          )}
        >
          {displayLabel}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-(--ink-muted)" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute z-50 mt-1 w-[min(17.5rem,calc(100vw-2rem))] rounded-lg border border-(--border) bg-white p-3 shadow-lg shadow-black/10"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-md p-1 text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)"
              onClick={() => setCursorMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium text-(--ink)">
              {format(cursorMonth, "MMMM yyyy")}
            </p>
            <button
              type="button"
              className="rounded-md p-1 text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink)"
              onClick={() => setCursorMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-(--ink-subtle)"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, cursorMonth);
              const active = selectedValid
                ? isSameDay(day, selectedValid)
                : false;
              const today = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => commit(day)}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-md text-sm transition-colors",
                    !inMonth && "text-(--ink-subtle)",
                    inMonth &&
                      !active &&
                      "text-(--ink) hover:bg-(--surface-muted)",
                    active &&
                      "bg-(--brand) font-medium text-white hover:bg-(--brand-hover)",
                    today && !active && "ring-1 ring-(--brand)/40",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {includeTime ? (
            <div className="mt-3 flex items-center gap-2 border-t border-(--border) pt-3">
              <label className="text-xs text-(--ink-muted)">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  const nextTime = e.target.value || "00:00";
                  setTime(nextTime);
                  if (selectedValid) commit(selectedValid, nextTime);
                }}
                className="h-10 flex-1 rounded-md border border-(--border) bg-white px-2 text-base text-(--ink) focus:border-(--brand) focus:outline-none focus:ring-2 focus:ring-(--brand)/20"
              />
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs font-medium text-(--brand) hover:bg-(--brand-soft)"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <div className="mt-3 flex justify-between border-t border-(--border) pt-3">
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs text-(--ink-muted) hover:bg-(--surface-muted)"
                onClick={() => {
                  if (!isControlled) setInternalValue("");
                  onChange?.({ target: { value: "", name } });
                  setOpen(false);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-xs font-medium text-(--brand) hover:bg-(--brand-soft)"
                onClick={() => commit(new Date())}
              >
                Today
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
