import Link from "next/link";

import { LoginButton } from "@/components/auth/login-button";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Auto Offensive</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Authentication is handled by Keycloak. Session cookies are managed by BetterAuth.
        </p>

        <div className="mt-6">
          <LoginButton />
        </div>

        <p className="mt-6 text-sm text-slate-600">
          No account yet?{" "}
          <Link href="/register" className="font-semibold text-sky-700 hover:text-sky-800">
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}
