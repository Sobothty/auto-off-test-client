import { NextResponse } from "next/server";

import {
  GatewayRequestError,
  type RegisterUserInput,
  registerUserThroughGateway,
} from "@/lib/backend";

function normalizeInput(body: unknown): RegisterUserInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const source = body as Record<string, unknown>;
  const username = typeof source.username === "string" ? source.username.trim() : "";
  const email = typeof source.email === "string" ? source.email.trim() : "";
  const password = typeof source.password === "string" ? source.password : "";

  if (!username || !email || !password) {
    return null;
  }

  const alias_name = typeof source.alias_name === "string" ? source.alias_name.trim() : "";
  const avatar_profile =
    typeof source.avatar_profile === "string" ? source.avatar_profile.trim() : "";

  return {
    username,
    email,
    password,
    alias_name: alias_name || undefined,
    avatar_profile: avatar_profile || undefined,
  };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const normalized = normalizeInput(body);
  if (!normalized) {
    return NextResponse.json(
      { message: "username, email, and password are required" },
      { status: 400 },
    );
  }

  try {
    const result = await registerUserThroughGateway(normalized);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof GatewayRequestError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Unexpected registration error" },
      { status: 500 },
    );
  }
}
