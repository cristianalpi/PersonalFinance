"use client";

import { useState } from "react";
import { formatPesosInput } from "@/lib/finance";

/**
 * A peso amount that formats itself as you type: "$ 1.500.000". The server
 * reads only the digits, so the formatted text is submitted as is.
 */
export function MoneyInput({
  name,
  defaultValue,
  required,
  placeholder = "$ 0",
  autoFocus,
  label,
}: {
  name: string;
  defaultValue?: number | string | null;
  required?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  label?: string;
}) {
  const [value, setValue] = useState(() => formatPesosInput(defaultValue));
  return (
    <input
      className="input num"
      name={name}
      value={value}
      onChange={(e) => {
        setValue(formatPesosInput(e.target.value));
        // Keep the caret at the end: the dots move as digits are typed.
        const el = e.target;
        requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
      }}
      inputMode="numeric"
      autoComplete="off"
      enterKeyHint="done"
      placeholder={placeholder}
      required={required}
      autoFocus={autoFocus}
      aria-label={label}
    />
  );
}
