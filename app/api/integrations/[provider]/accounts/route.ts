import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getSessionAndKeycloakAccessToken } from "@/lib/server-auth";
import { readOptionalEnv } from "@/lib/server-env";

const backendUrl = readOptionalEnv("FASTAPI_GATEWAY_URL", "http://localhost:8000");
const allowedProviders = new Set(["github", "gitlab"]);

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

function normalizeProvider(raw: string): string {
  const provider = raw.trim().toLowerCase();
  if (!allowedProviders.has(provider)) {
    return "";
  }
  return provider;
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  const params = await context.params;
  const provider = normalizeProvider(params.provider);
  if (!provider) {
    return NextResponse.json({ message: "Unsupported provider" }, { status: 404 });
  }

  const requestHeaders = await headers();
  const authContext = await getSessionAndKeycloakAccessToken(requestHeaders);
  if (!authContext.ok) {
    return authContext.response;
  }

  const backendResponse = await fetch(`${backendUrl}/integrations/${provider}/accounts`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authContext.accessToken}`,
    },
    cache: "no-store",
  });

  const raw = await backendResponse.text();
  const payload = parseJsonSafe(raw);
  if (backendResponse.ok === false) {
    return NextResponse.json(
      { message: readMessage(payload, `Failed to load ${provider} accounts`) },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(
    {
      provider,
      accounts: normalizeAccounts(payload),
    },
    { status: 200 },
  );
}
