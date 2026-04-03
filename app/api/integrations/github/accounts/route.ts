import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { readOptionalEnv } from "@/lib/server-env";

const backendUrl = readOptionalEnv("FASTAPI_GATEWAY_URL", "http://localhost:8000");

type JsonDict = Record<string, unknown>;

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

function normalizeAccounts(payload: unknown): JsonDict[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const result: JsonDict[] = [];
  for (const item of payload) {
    if (item != null && typeof item === "object") {
      result.push(item as JsonDict);
    }
  }
  return result;
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

  const backendResponse = await fetch(`${backendUrl}/integrations/github/accounts`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const raw = await backendResponse.text();
  const payload = parseJsonSafe(raw);

  if (backendResponse.ok === false) {
    return NextResponse.json(
      { message: readMessage(payload, "Failed to load GitHub accounts") },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(
    {
      provider: "github",
      accounts: normalizeAccounts(payload),
    },
    { status: 200 },
  );
}
