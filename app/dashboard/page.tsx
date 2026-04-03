import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BackendMePanel } from "@/components/auth/backend-me-panel";
import { LogoutButton } from "@/components/auth/logout-button";
import { GitProvidersPanel } from "@/components/integrations/git-providers-panel";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session == null) {
    redirect("/login");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-sky-700">Authenticated</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Dashboard</h1>
        </div>
        <LogoutButton />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Session User (BetterAuth)</h2>
        <dl className="mt-4 grid gap-3 text-sm text-slate-700">
          <div>
            <dt className="font-medium text-slate-500">User ID</dt>
            <dd className="break-all">{session.user.id}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Name</dt>
            <dd>{session.user.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Email</dt>
            <dd>{session.user.email}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Git Providers</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connect and manage your GitHub and GitLab accounts for repository access.
        </p>
        <div className="mt-4">
          <GitProvidersPanel />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Backend Profile</h2>
        <p className="mt-1 text-sm text-slate-600">
          Loaded from Next.js endpoint <code>/api/me</code>
        </p>
        <div className="mt-4">
          <BackendMePanel />
        </div>
      </section>
    </main>
  );
}
