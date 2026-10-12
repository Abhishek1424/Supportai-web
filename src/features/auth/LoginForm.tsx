// The login screen's form. "use client" = runs in the browser because it uses state.
// Flutter idea: a StatefulWidget with a Form, two TextEditingControllers and a submit
//   button.
// Flow: tap Sign in -> useLogin().mutate -> POST /api/auth/login -> cookies set -> go to
//   /dashboard.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { getErrorMessage } from "@/lib/api";
import { useLogin } from "./hooks";

/**
 * The sign-in form.
 *
 * Flow: user submits -> useLogin calls /api/auth/login -> server sets cookies
 * -> we navigate to /dashboard. A wrong password shows the backend's generic
 * "Invalid email or password." message (it deliberately never says which part
 * was wrong).
 *
 * @returns The form UI.
 */
// Closest idea: a StatefulWidget. The `use...` lines at the top are its state and services.
export function LoginForm() {
  // Navigation. Flutter idea: `Navigator.of(context)` / `context.go(...)`.
  const router = useRouter();
  // The login 'service'. It knows isPending / isError / error.
  const login = useLogin();
  // State + setter. Flutter idea: a `String email` field and `setState(() => email = v)`.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Submit handler: stop the browser's default page reload and start the login.
   *
   * @param event The form submit event.
   */
  // Runs on form submit. `preventDefault` stops the browser reloading the page. Then we
  //   call the API.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => router.replace("/dashboard") });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      {login.isError && <Alert>{getErrorMessage(login.error)}</Alert>}
      <Button type="submit" loading={login.isPending} className="w-full">
        Sign in
      </Button>
      <p className="text-center text-sm text-slate-600">
        New to SupportAI?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
