import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { readOptionalEnv } from "@/lib/server-env";

const backendUrl = readOptionalEnv("FASTAPI_GATEWAY_URL", "http://localhost:8000");

type Dict = Record<string, unknown>;

function parseJsonSafe(raw: string): unknown {
  if (raw.length === 0) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

function readMessage(payload: unknown, fallback: string): string {
  if (payload == null || typeof payload !== "object") {
    return fallback;
  }

  const source = payload as { detail?: unknown; message?: unknown };
  if (typeof source.detail === "string" && source.detail.trim().length > 0) {
    return source.detail;
  }
  if (typeof source.message === "string" && source.message.trim().length > 0) {
    return source.message;
  }

  return fallback;
}

export async function GET() {
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (session == null) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  let accessToken = "";
  try {
    const tokenResponse = await auth.api.getAccessToken({
      headers: requestHeaders,
      body: {
        providerId: "keycloak",
      },
    });
    accessToken = tokenResponse.accessToken;
  } catch {
    return NextResponse.json(
      { message: "Unable to read Keycloak access token from session" },
      { status: 401 },
    );
  }

  const authResponse = await fetch(`${backendUrl}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const authRaw = await authResponse.text();
  const authPayload = parseJsonSafe(authRaw);

  if (authResponse.ok === false) {
    return NextResponse.json(
      {
        message: readMessage(authPayload, "Failed to read auth profile"),
        auth: authPayload,
      },
      { status: authResponse.status },
    );
  }

  const authDict: Dict =
    authPayload != null && typeof authPayload === "object"
      ? (authPayload as Dict)
      : {};

  const userId =
    typeof authDict.user_id === "string" && authDict.user_id.trim().length > 0
      ? authDict.user_id.trim()
      : "";

  if (userId.length === 0) {
    return NextResponse.json(
      {
        message: "Token validated but no user_id returned by backend auth",
        auth: authPayload,
      },
      { status: 502 },
    );
  }

  const userResponse = await fetch(`${backendUrl}/users/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const userRaw = await userResponse.text();
  const userPayload = parseJsonSafe(userRaw);

  if (userResponse.ok === false) {
    return NextResponse.json(
      {
        message: readMessage(userPayload, "Failed to read user from database"),
        auth: authPayload,
        user: null,
      },
      { status: userResponse.status },
    );
  }

  return NextResponse.json(
    {
      auth: authPayload,
      user: userPayload,
    },
    { status: 200 },
  );
}
