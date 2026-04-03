"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unable to start login.";
  }

  const maybe = error as { message?: unknown };
  if (typeof maybe.message === "string" && maybe.message.trim()) {
    return maybe.message;
  }

  return "Unable to start login.";
}

export function LoginButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);

    const result = await authClient.signIn.oauth2({
      providerId: "keycloak",
      callbackURL: "/dashboard",
      errorCallbackURL: "/login",
    });

    if (result.error) {
      setError(getErrorMessage(result.error));
      setPending(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Redirecting to Keycloak..." : "Login with Keycloak"}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
