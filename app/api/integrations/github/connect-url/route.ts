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

  const backendResponse = await fetch(`${backendUrl}/integrations/github/connect-url`, {
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
      { message: readMessage(payload, "Failed to create GitHub connect URL") },
      { status: backendResponse.status },
    );
  }

  const data: JsonDict = payload != null && typeof payload === "object" ? (payload as JsonDict) : {};
  const connectUrl =
    typeof data.connect_url === "string" && data.connect_url.trim().length > 0
      ? data.connect_url.trim()
      : "";

  if (connectUrl.length === 0) {
    return NextResponse.json(
      { message: "Backend did not return connect_url" },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      provider: "github",
      connect_url: connectUrl,
    },
    { status: 200 },
  );
}
