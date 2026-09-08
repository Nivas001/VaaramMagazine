"use client";

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 6;

/**
 * A six-digit segmented code input.
 *
 * It is six real inputs rather than one styled box, because that is what lets
 * the browser and the operating system offer the code from an email or SMS —
 * `autocomplete="one-time-code"` only works on a real input. The value itself
 * is held as a single string by the parent, so the segments can never drift
 * out of sync with each other.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  label = "Verification code",
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  label?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(LENGTH, " ").slice(0, LENGTH).split("");

  // Focus the first empty box whenever the field is enabled and incomplete.
  useEffect(() => {
    if (disabled) return;
    const next = Math.min(value.length, LENGTH - 1);
    refs.current[next]?.focus();
    // Only on mount and when re-enabled — not on every keystroke, which would
    // fight the user's own caret.
  }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  function setDigit(index: number, digit: string) {
    const next = value.padEnd(LENGTH, " ").split("");
    next[index] = digit;
    const joined = next.join("").replace(/\s/g, "").slice(0, LENGTH);
    onChange(joined);
    return joined;
  }

  function onInput(index: number, raw: string) {
    // Some keyboards deliver the whole code at once into a single box.
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;

    if (clean.length > 1) {
      const filled = clean.slice(0, LENGTH);
      onChange(filled);
      refs.current[Math.min(filled.length, LENGTH - 1)]?.focus();
      if (filled.length === LENGTH) onComplete?.(filled);
      return;
    }

    const joined = setDigit(index, clean);
    if (index < LENGTH - 1) refs.current[index + 1]?.focus();
    if (joined.length === LENGTH) onComplete?.(joined);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index].trim()) {
        setDigit(index, " ");
      } else if (index > 0) {
        // Empty box: step back and clear the one before it.
        setDigit(index - 1, " ");
        refs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
    if (pasted.length === LENGTH) onComplete?.(pasted);
  }

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="label-eyebrow text-[rgb(var(--text-faint))]">{label}</legend>

      <div className="mt-3 flex gap-2 sm:gap-2.5">
        {Array.from({ length: LENGTH }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={digits[i].trim()}
            onChange={(e) => onInput(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
            // Only the first box advertises one-time-code; repeating it makes
            // some browsers autofill the same digit into every segment.
            autoComplete={i === 0 ? "one-time-code" : "off"}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            aria-label={`Digit ${i + 1} of ${LENGTH}`}
            aria-invalid={invalid || undefined}
            className={cn(
              "h-14 min-w-0 flex-1 rounded-lg border text-center font-display text-2xl tabular-nums",
              "bg-[rgb(var(--surface))] text-[rgb(var(--text))] outline-none",
              "transition-[border-color,box-shadow] duration-150",
              "disabled:opacity-50 sm:h-16 sm:text-3xl",
              invalid
                ? "border-[rgb(var(--accent))]"
                : "border-[rgb(var(--hairline))] focus:border-[rgb(var(--accent))] focus:shadow-[0_0_0_3px_rgb(var(--accent)/0.14)]"
            )}
          />
        ))}
      </div>
    </fieldset>
  );
}
