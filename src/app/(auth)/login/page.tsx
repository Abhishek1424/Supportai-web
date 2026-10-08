import { LoginForm } from "@/features/auth/LoginForm";

/** /login: sign in to an existing account. */
export default function LoginPage() {
  return (
    <>
      <p className="mb-6 text-sm text-slate-600">Sign in to your workspace</p>
      <LoginForm />
    </>
  );
}
