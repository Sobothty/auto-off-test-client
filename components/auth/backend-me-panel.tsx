"use client";

import { useEffect, useState } from "react";

type BackendMeResponse = {
  auth?: Record<string, unknown>;
  user?: Record<string, unknown> | null;
  message?: string;
};

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function BackendMePanel() {
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BackendMeResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/me", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as BackendMeResponse;

      if (response.ok === false) {
        const message = readText(payload.message) || "Failed to load backend user";
        setError(message);
        setPending(false);
        return;
      }

      setData(payload);
      setPending(false);
    };

    void run();
  }, []);

  if (pending) {
    return <p className="text-sm text-slate-600">Loading backend user profile...</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }

  const auth = data?.auth ?? {};
  const user = data?.user ?? {};

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Auth Claims (FastAPI /auth/me)</h3>
        <dl className="mt-3 space-y-2 text-sm text-slate-700">
          <div>
            <dt className="font-medium text-slate-500">user_id</dt>
            <dd className="break-all">{readText(auth.user_id)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">actor_type</dt>
            <dd>{readText(auth.actor_type)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">azp</dt>
            <dd className="break-all">{readText(auth.azp)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">User In DB (Go /users/{'{id}'})</h3>
        <dl className="mt-3 space-y-2 text-sm text-slate-700">
          <div>
            <dt className="font-medium text-slate-500">user_id</dt>
            <dd className="break-all">{readText(user.user_id)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">username</dt>
            <dd>{readText(user.username)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">email</dt>
            <dd>{readText(user.email)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">alias_name</dt>
            <dd>{readText(user.alias_name)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
