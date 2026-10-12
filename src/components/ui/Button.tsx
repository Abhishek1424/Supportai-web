// A reusable button. Flutter idea: your own `AppButton` widget wrapping ElevatedButton.
//
// React -> Flutter quick map (used in all component files):
//   component (a function returning UI) ~ a Widget. No class needed.
//   props (the function parameters)      ~ Widget constructor parameters.
//   children                             ~ the `child` widget.
//   useState                             ~ State in a StatefulWidget (`setState`).
//   useEffect                            ~ initState / dispose logic.
//   JSX (HTML-like code in the function) ~ the widget tree in `build()`.
//   When state changes the function runs again, like `build()` after `setState`.
// These are only similar ideas. They are not exactly the same.
import type { ButtonHTMLAttributes } from "react";

// Allowed button styles. Dart idea: `enum ButtonVariant { primary, secondary, danger }`.
type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
  danger: "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Shows a busy label and disables the button (prevents double submits). */
  loading?: boolean;
}

/**
 * Standard button with three visual variants.
 *
 * Why `loading`: disabling during a request stops users double-clicking and
 * creating duplicate records.
 *
 * @param props Native button props plus `variant` and `loading`.
 * @returns A styled <button>.
 */
// Props = constructor params. `loading` disables the button so the user cannot tap twice
//   (like `onPressed: null`).
export function Button({ variant = "primary", loading, disabled, children, className = "", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
