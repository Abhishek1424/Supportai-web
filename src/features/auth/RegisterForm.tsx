// The sign-up form. Same idea as LoginForm but with 4 fields. Creates the company and its
//   owner.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { getErrorMessage } from "@/lib/api";
import { useRegister } from "./hooks";

/** Must match the backend's PASSWORD_MIN_LENGTH so users get instant feedback. */
const PASSWORD_MIN_LENGTH = 10;

/**
 * The sign-up form for a new business.
 *
 * Creates the user AND their organization (they become its owner). The
 * length rule is checked in the browser for instant feedback, but the backend
 * validates again; client-side checks are never trusted.
 *
 * @returns The form UI.
 */
// Like a StatefulWidget with a Form.
export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  // One object for all fields. Dart idea: a `Map<String,String>` or a small form model.
  const [form, setForm] = useState({ full_name: "", organization_name: "", email: "", password: "" });

  /**
   * Build a change handler for one form field.
   *
   * @param key Which field of the form state to update.
   * @returns An onChange handler for an input.
   */
  // Returns a function that updates ONE field. A function that returns a function is a
  //   closure.
  const update = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: e.target.value }));

  /**
   * Submit handler: prevent page reload, then register and go to the dashboard.
   *
   * @param event The form submit event.
   */
  // Prevents page reload, calls register, then goes to /dashboard.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    register.mutate(form, { onSuccess: () => router.replace("/dashboard") });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Your name" autoComplete="name" required value={form.full_name} onChange={update("full_name")} />
      <Field label="Company name" required value={form.organization_name} onChange={update("organization_name")} />
      <Field label="Work email" type="email" autoComplete="email" required value={form.email} onChange={update("email")} />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        hint={`At least ${PASSWORD_MIN_LENGTH} characters`}
        value={form.password}
        onChange={update("password")}
      />
      {register.isError && <Alert>{getErrorMessage(register.error)}</Alert>}
      <Button type="submit" loading={register.isPending} className="w-full">
        Create account
      </Button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
