"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  username: string;
  email: string;
  password: string;
  alias_name: string;
  avatar_profile: string;
};

const initialState: FormState = {
  username: "",
  email: "",
  password: "",
  alias_name: "",
  avatar_profile: "",
};

function readMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Registration failed";
  }

  const source = payload as { message?: unknown; detail?: unknown };
  if (typeof source.message === "string" && source.message.trim()) {
    return source.message;
  }
  if (typeof source.detail === "string" && source.detail.trim()) {
    return source.detail;
  }

  return "Registration failed";
}

export function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialState);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      setError(readMessage(payload));
      setPending(false);
      return;
    }

    router.push("/login?registered=1");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          value={form.username}
          onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-200 transition focus:ring"
          placeholder="jane.doe"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-200 transition focus:ring"
          placeholder="jane@example.com"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-200 transition focus:ring"
          placeholder="••••••••"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="alias_name">
          Alias Name (optional)
        </label>
        <input
          id="alias_name"
          value={form.alias_name}
          onChange={(event) => setForm((prev) => ({ ...prev, alias_name: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-200 transition focus:ring"
          placeholder="Jane"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="avatar_profile">
          Avatar URL (optional)
        </label>
        <input
          id="avatar_profile"
          value={form.avatar_profile}
          onChange={(event) => setForm((prev) => ({ ...prev, avatar_profile: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-200 transition focus:ring"
          placeholder="https://..."
        />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
