import "server-only";

import { readOptionalEnv } from "@/lib/server-env";

const backendUrl = readOptionalEnv("FASTAPI_GATEWAY_URL", "http://localhost:8000");

export type RegisterUserInput = {
  username: string;
  email: string;
  password: string;
  alias_name?: string;
  avatar_profile?: string;
};

export class GatewayRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function parseDetail(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Registration failed";
  }

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return "Registration failed";
}

export async function registerUserThroughGateway(
  payload: RegisterUserInput,
): Promise<unknown> {
  const response = await fetch(`${backendUrl}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const raw = await response.text();
  const parsed = raw ? safeJsonParse(raw) : null;

  if (!response.ok) {
    throw new GatewayRequestError(response.status, parseDetail(parsed));
  }

  return parsed;
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}
