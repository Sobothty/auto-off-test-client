import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Auto Offensive</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Registration is delegated to your FastAPI gateway so Keycloak + Go DB stay consistent.
        </p>

        <div className="mt-6">
          <RegisterForm />
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-sky-700 hover:text-sky-800">
            Go to login
          </Link>
        </p>
      </div>
    </main>
  );
}
