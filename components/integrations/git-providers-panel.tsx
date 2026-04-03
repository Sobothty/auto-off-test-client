"use client";

import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  GitProvider,
  ProviderAccount,
  ProviderRepository,
  useGetProviderAccountsQuery,
  useGetProviderRepositoriesQuery,
  useLazyGetProviderConnectUrlQuery,
} from "@/lib/redux/services/integrations-api";

const providers: GitProvider[] = ["github", "gitlab"];

const providerLabel: Record<GitProvider, string> = {
  github: "GitHub",
  gitlab: "GitLab",
};

const providerDescription: Record<GitProvider, string> = {
  github: "Connect GitHub to grant repository access for scans and CI/CD integrations.",
  gitlab: "Connect GitLab to grant repository access for scans and CI/CD integrations.",
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown): boolean {
  return value === true;
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

function formatUpdatedAt(value: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function accountKey(account: ProviderAccount): string {
  const id = asText(account.id);
  if (id) {
    return id;
  }

  const provider = asText(account.provider_type);
  const accountId = asText(account.provider_account_id);
  const connectedAt = asText(account.connected_at);
  return `${provider}:${accountId}:${connectedAt}`;
}

function repositoryKey(repository: ProviderRepository): string {
  const provider = asText(repository.provider_type);
  const repositoryId = asText(repository.repository_id);
  const fullName = asText(repository.full_name);
  return `${provider}:${repositoryId}:${fullName}`;
}

function normalizeProvider(raw: string | null): GitProvider | null {
  if (raw === "github" || raw === "gitlab") {
    return raw;
  }
  return null;
}

function readPayloadMessage(payload: unknown): string {
  if (payload == null || typeof payload !== "object") {
    return "";
  }

  const source = payload as { detail?: unknown; message?: unknown };
  const detail = asText(source.detail).trim();
  if (detail) {
    return detail;
  }

  const message = asText(source.message).trim();
  if (message) {
    return message;
  }

  return "";
}

function readRtkErrorMessage(
  error: FetchBaseQueryError | SerializedError | undefined,
  fallback: string,
): string {
  if (!error) {
    return fallback;
  }

  if ("status" in error) {
    const message = readPayloadMessage(error.data);
    if (message) {
      return message;
    }
    return fallback;
  }

  const message = asText(error.message).trim();
  if (message) {
    return message;
  }

  return fallback;
}

function filterRepositories(items: ProviderRepository[], search: string): ProviderRepository[] {
  const term = search.trim().toLowerCase();
  if (!term) {
    return items;
  }

  return items.filter((item) => {
    const fullName = asText(item.full_name).toLowerCase();
    const name = asText(item.name).toLowerCase();
    const username = asText(item.provider_username).toLowerCase();
    return fullName.includes(term) || name.includes(term) || username.includes(term);
  });
}

export function GitProvidersPanel() {
  const searchParams = useSearchParams();

  const githubAccountsQuery = useGetProviderAccountsQuery("github");
  const gitlabAccountsQuery = useGetProviderAccountsQuery("gitlab");

  const githubRepositoriesQuery = useGetProviderRepositoriesQuery("github");
  const gitlabRepositoriesQuery = useGetProviderRepositoriesQuery("gitlab");

  const [triggerConnectUrl] = useLazyGetProviderConnectUrlQuery();

  const [connectingProvider, setConnectingProvider] = useState<GitProvider | null>(null);
  const [connectErrors, setConnectErrors] = useState<Partial<Record<GitProvider, string>>>({});
  const [repoSearch, setRepoSearch] = useState("");

  const accountsQueryByProvider = {
    github: githubAccountsQuery,
    gitlab: gitlabAccountsQuery,
  };

  const repositoriesQueryByProvider = {
    github: githubRepositoriesQuery,
    gitlab: gitlabRepositoriesQuery,
  };

  const totalConnectedAccounts = useMemo(() => {
    const githubCount = Array.isArray(githubAccountsQuery.data?.accounts)
      ? githubAccountsQuery.data.accounts.length
      : 0;
    const gitlabCount = Array.isArray(gitlabAccountsQuery.data?.accounts)
      ? gitlabAccountsQuery.data.accounts.length
      : 0;
    return githubCount + gitlabCount;
  }, [githubAccountsQuery.data?.accounts, gitlabAccountsQuery.data?.accounts]);

  const totalRepositories = useMemo(() => {
    const githubCount = Array.isArray(githubRepositoriesQuery.data?.repositories)
      ? githubRepositoriesQuery.data.repositories.length
      : 0;
    const gitlabCount = Array.isArray(gitlabRepositoriesQuery.data?.repositories)
      ? gitlabRepositoriesQuery.data.repositories.length
      : 0;
    return githubCount + gitlabCount;
  }, [githubRepositoriesQuery.data?.repositories, gitlabRepositoriesQuery.data?.repositories]);

  const statusBanner = useMemo(() => {
    const provider = normalizeProvider(searchParams.get("provider"));
    if (provider == null) {
      return null;
    }

    const git = searchParams.get("git");
    const message = searchParams.get("message");
    const username = searchParams.get("username");

    if (git === "connected") {
      return {
        type: "success" as const,
        text: username
          ? `${providerLabel[provider]} connected as ${username}`
          : `${providerLabel[provider]} connected`,
      };
    }

    if (git === "error") {
      return {
        type: "error" as const,
        text: message || `Failed to connect ${providerLabel[provider]}`,
      };
    }

    return null;
  }, [searchParams]);

  const connectProvider = async (provider: GitProvider) => {
    setConnectingProvider(provider);
    setConnectErrors((prev) => ({ ...prev, [provider]: "" }));

    try {
      const payload = await triggerConnectUrl(provider, false).unwrap();
      const connectUrl = asText(payload.connect_url).trim();
      if (!connectUrl) {
        setConnectErrors((prev) => ({
          ...prev,
          [provider]: "Missing connect URL from backend",
        }));
        return;
      }

      window.location.assign(connectUrl);
    } catch (error) {
      setConnectErrors((prev) => ({
        ...prev,
        [provider]: readRtkErrorMessage(
          error as FetchBaseQueryError | SerializedError,
          `Failed to start ${providerLabel[provider]} connect flow`,
        ),
      }));
    } finally {
      setConnectingProvider(null);
    }
  };

  return (
    <div className="space-y-4">
      {statusBanner ? (
        <div
          className={
            statusBanner.type === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          }
        >
          {statusBanner.text}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connected Accounts</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalConnectedAccounts}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fetched Repositories</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{totalRepositories}</p>
          </div>
          <label className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search Repositories</span>
            <input
              value={repoSearch}
              onChange={(event) => setRepoSearch(event.target.value)}
              placeholder="repo name, full name, or account"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-500"
            />
          </label>
        </div>
      </div>

      {providers.map((provider) => {
        const accountsQuery = accountsQueryByProvider[provider];
        const repositoriesQuery = repositoriesQueryByProvider[provider];

        const accounts = Array.isArray(accountsQuery.data?.accounts)
          ? accountsQuery.data.accounts
          : [];
        const repositories = Array.isArray(repositoriesQuery.data?.repositories)
          ? repositoriesQuery.data.repositories
          : [];

        const filteredRepositories = filterRepositories(repositories, repoSearch);

        const accountsLoading = accountsQuery.isLoading || accountsQuery.isFetching;
        const repositoriesLoading = repositoriesQuery.isLoading || repositoriesQuery.isFetching;

        const connectError = connectErrors[provider] ?? "";
        const accountsError = accountsQuery.isError
          ? readRtkErrorMessage(
              accountsQuery.error,
              `Failed to load ${providerLabel[provider]} accounts`,
            )
          : "";
        const repositoriesError = repositoriesQuery.isError
          ? readRtkErrorMessage(
              repositoriesQuery.error,
              `Failed to load ${providerLabel[provider]} repositories`,
            )
          : "";
        const error = connectError || accountsError || repositoriesError;

        return (
          <div key={provider} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {error ? (
              <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{providerLabel[provider]} Provider</h3>
                <p className="text-sm text-slate-600">{providerDescription[provider]}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void connectProvider(provider);
                }}
                disabled={connectingProvider === provider}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connectingProvider === provider ? "Redirecting..." : `Connect ${providerLabel[provider]}`}
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Linked {providerLabel[provider]} Accounts</p>

                {accountsLoading ? <p className="mt-2 text-sm text-slate-500">Loading accounts...</p> : null}

                {!accountsLoading && accounts.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No {providerLabel[provider]} account linked yet.</p>
                ) : null}

                {!accountsLoading && accounts.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {accounts.map((account) => (
                      <div key={accountKey(account)} className="rounded-lg border border-slate-200 bg-white p-3">
                        <p className="text-sm font-semibold text-slate-900">{asText(account.provider_username)}</p>
                        <p className="text-xs text-slate-500">{asText(account.provider_email) || "no-email"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          status: {asText(account.status)}
                          {asText(account.connected_at)
                            ? ` • connected: ${formatConnectedAt(asText(account.connected_at))}`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Repositories</p>
                  <p className="text-xs text-slate-500">{filteredRepositories.length} shown</p>
                </div>

                {repositoriesLoading ? <p className="mt-2 text-sm text-slate-500">Loading repositories...</p> : null}

                {!repositoriesLoading && filteredRepositories.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No repositories found for this provider.</p>
                ) : null}

                {!repositoriesLoading && filteredRepositories.length > 0 ? (
                  <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
                    {filteredRepositories.map((repository) => (
                      <div key={repositoryKey(repository)} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{asText(repository.full_name) || asText(repository.name)}</p>
                            <p className="text-xs text-slate-500">
                              account: {asText(repository.provider_username)}
                            </p>
                          </div>
                          <span
                            className={
                              asBoolean(repository.is_private)
                                ? "rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                                : "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            }
                          >
                            {asBoolean(repository.is_private) ? "private" : "public"}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>default: {asText(repository.default_branch) || "-"}</span>
                          <span>updated: {formatUpdatedAt(asText(repository.updated_at))}</span>
                          {asText(repository.web_url) ? (
                            <a
                              href={asText(repository.web_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-sky-700 hover:text-sky-600"
                            >
                              open
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
