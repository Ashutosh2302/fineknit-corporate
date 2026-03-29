import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";
import { verifySessionToken, type SessionPayload } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function requireRole(
  request: NextRequest,
  role: "admin" | "client"
): SessionPayload | NextResponse {
  const session = getSessionFromRequest(request);
  if (!session || session.role !== role) {
    return jsonError("Unauthorized", 401);
  }
  return session;
}
