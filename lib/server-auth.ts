import "server-only";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

type SessionShape = {
  user?: {
    id?: string;
  };
};

type AccountShape = {
  providerId?: string;
  accountId?: string;
};

type AccessTokenShape = {
  accessToken?: string;
};

export type SessionAccessTokenResult =
  | { ok: true; session: SessionShape; accessToken: string }
  | { ok: false; response: NextResponse };

function readErrorMessage(error: unknown, fallback: string): string {
  if (error == null || typeof error !== "object") {
    return fallback;
  }

  const source = error as {
    message?: unknown;
    error?: {
      message?: unknown;
      statusText?: unknown;
    };
  };

  if (typeof source.message === "string" && source.message.trim().length > 0) {
    return source.message;
  }

  if (
    source.error &&
    typeof source.error.message === "string" &&
    source.error.message.trim().length > 0
  ) {
    return source.error.message;
  }

  if (
    source.error &&
    typeof source.error.statusText === "string" &&
    source.error.statusText.trim().length > 0
  ) {
    return source.error.statusText;
  }

  return fallback;
}

export async function getSessionAndKeycloakAccessToken(
  requestHeaders: Headers,
): Promise<SessionAccessTokenResult> {
  const session = (await auth.api.getSession({
    headers: requestHeaders,
  })) as SessionShape | null;

  if (session == null) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthenticated" }, { status: 401 }),
    };
  }

  const userId = typeof session.user?.id === "string" ? session.user.id : "";
  if (userId.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Session is missing user id" },
        { status: 401 },
      ),
    };
  }

  let accountId: string | undefined;
  try {
    const accounts = (await auth.api.listUserAccounts({
      headers: requestHeaders,
    })) as AccountShape[];
    if (Array.isArray(accounts)) {
      const keycloakAccount = accounts.find((account) => account.providerId === "keycloak");
      if (typeof keycloakAccount?.accountId === "string" && keycloakAccount.accountId.trim()) {
        accountId = keycloakAccount.accountId.trim();
      }
    }
  } catch {
    // Continue without accountId; userId fallback is still passed to getAccessToken.
  }

  try {
    const tokenResponse = (await auth.api.getAccessToken({
      headers: requestHeaders,
      body: {
        providerId: "keycloak",
        accountId,
        userId,
      },
    })) as AccessTokenShape;

    const accessToken =
      typeof tokenResponse.accessToken === "string"
        ? tokenResponse.accessToken.trim()
        : "";

    if (!accessToken) {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "Keycloak access token is empty" },
          { status: 401 },
        ),
      };
    }

    return {
      ok: true,
      session,
      accessToken,
    };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: readErrorMessage(
            error,
            "Unable to read Keycloak access token from session",
          ),
        },
        { status: 401 },
      ),
    };
  }
}
