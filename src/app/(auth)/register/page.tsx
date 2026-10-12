// Screen for /register. Shows <RegisterForm />.
import { RegisterForm } from "@/features/auth/RegisterForm";

/** /register: create a new business account and workspace. */
export default function RegisterPage() {
  return (
    <>
      <p className="mb-6 text-sm text-slate-600">Create your company workspace</p>
      <RegisterForm />
    </>
  );
}
