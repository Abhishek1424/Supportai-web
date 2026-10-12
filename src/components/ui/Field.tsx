// Reusable text field and dropdown with a label. Flutter idea: a `TextFormField` /
//   `DropdownButtonFormField` wrapper widget.
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

// Tailwind = short CSS class names. Like a shared `InputDecoration` style.
const CONTROL_CLASSES =
  "block w-full rounded-md border-0 px-3 py-2 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-100";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

/**
 * Labelled text input.
 *
 * Accessibility: the label is tied to the input by a generated id, so screen
 * readers (and tests using getByLabelText) can find the field.
 *
 * @param props Native input props plus `label` and an optional `hint`.
 * @returns A label + input pair.
 */
// Text input + label. `...rest` passes all other props to the <input>, like forwarding
//   named params.
export function Field({ label, hint, ...rest }: FieldProps) {
  // Makes a unique id so the label is linked to its input (helps screen readers and tests).
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input id={id} className={CONTROL_CLASSES} {...rest} />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

/**
 * Labelled dropdown (same accessibility approach as Field).
 *
 * @param props Native select props plus `label`; options go in `children`.
 * @returns A label + select pair.
 */
// Dropdown version of Field. Options come as `children`.
export function SelectField({ label, children, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select id={id} className={CONTROL_CLASSES} {...rest}>
        {children}
      </select>
    </div>
  );
}
