import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Auto Offensive</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Gateway Auth Client</h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600">
          Login uses Keycloak through BetterAuth. Registration is sent to FastAPI `/users` so your
          Keycloak user and Go database user are created in one backend-controlled flow.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {session ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
