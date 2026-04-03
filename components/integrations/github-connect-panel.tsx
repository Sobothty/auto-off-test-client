"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type GithubAccount = {
  id?: string;
  provider_username?: string;
  provider_email?: string;
  status?: string;
  connected_at?: string;
};

type AccountsResponse = {
  accounts?: GithubAccount[];
  message?: string;
};

type ConnectResponse = {
  connect_url?: string;
  message?: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function formatConnectedAt(value: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function accountKey(account: GithubAccount): string {
  const id = asText(account.id);
  if (id) {
    return id;
  }

  const username = asText(account.provider_username);
  const connectedAt = asText(account.connected_at);
  return `${username}:${connectedAt}`;
}

export function GithubConnectPanel() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<GithubAccount[]>([]);

  const statusBanner = useMemo(() => {
    const provider = searchParams.get("provider");
    if (provider !== "github") {
      return null;
    }

    const git = searchParams.get("git");
    const message = searchParams.get("message");
    const username = searchParams.get("username");

    if (git === "connected") {
      return {
        type: "success" as const,
        text: username ? `GitHub connected as ${username}` : "GitHub connected",
      };
    }

    if (git === "error") {
      return {
        type: "error" as const,
        text: message || "Failed to connect GitHub",
      };
    }

    return null;
  }, [searchParams]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/integrations/github/accounts", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as AccountsResponse;

      if (response.ok === false) {
        setError(asText(payload.message) || "Failed to load linked GitHub accounts");
        setAccounts([]);
        setLoading(false);
        return;
      }

      setAccounts(Array.isArray(payload.accounts) ? payload.accounts : []);
      setLoading(false);
    };

    void run();
  }, []);

  const connectGithub = async () => {
    setConnecting(true);
    setError(null);

    const response = await fetch("/api/integrations/github/connect-url", {
      method: "GET",
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as ConnectResponse;

    if (response.ok === false) {
      setError(asText(payload.message) || "Failed to start GitHub connect flow");
      setConnecting(false);
      return;
    }

    const connectUrl = asText(payload.connect_url).trim();
    if (!connectUrl) {
      setError("Missing connect URL from backend");
      setConnecting(false);
      return;
    }

    window.location.assign(connectUrl);
  };

  return (
    <div className="space-y-4">
      {statusBanner ? (
        <div
          className={
            statusBanner.type === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          }
        >
          {statusBanner.text}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">GitHub Provider</h3>
          <p className="text-sm text-slate-600">
            Connect GitHub to grant repository access for scans and CI/CD integrations.
          </p>
        </div>
        <button
          type="button"
          onClick={connectGithub}
          disabled={connecting}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connecting ? "Redirecting..." : "Connect GitHub"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Linked GitHub Accounts</p>

        {loading ? <p className="mt-2 text-sm text-slate-500">Loading accounts...</p> : null}

        {!loading && accounts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No GitHub account linked yet.</p>
        ) : null}

        {!loading && accounts.length > 0 ? (
          <div className="mt-3 space-y-3">
            {accounts.map((account) => (
              <div key={accountKey(account)} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-900">{asText(account.provider_username)}</p>
                <p className="text-xs text-slate-500">{asText(account.provider_email) || "no-email"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  status: {asText(account.status)}
                  {asText(account.connected_at) ? ` • connected: ${formatConnectedAt(asText(account.connected_at))}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
