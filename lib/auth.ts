import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "nid_session";
const SESSION_DAYS = 7;
type AuthUser = { id: string; nid: string; name: string; passwordHash: string };

const fallbackUsers = new Map<string, AuthUser>();
const COOKIE_SECRET = process.env.SESSION_SECRET || "landcheck-demo-cookie-secret";

function signSession(user: Pick<AuthUser, "id" | "nid" | "name">, expiresAt: Date) {
  const payload = Buffer.from(JSON.stringify({ ...user, expiresAt: expiresAt.getTime() })).toString("base64url");
  const signature = createHmac("sha256", COOKIE_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readSession(token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = createHmac("sha256", COOKIE_SECRET).update(payload).digest();
  const receivedSignature = Buffer.from(signature, "base64url");
  if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      id: string;
      nid: string;
      name: string;
      expiresAt: number;
    };
    if (!session.id || !session.nid || !session.name || session.expiresAt <= Date.now()) return null;
    return { id: session.id, nid: session.nid, name: session.name, passwordHash: "" };
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const user = [...fallbackUsers.values()].find((candidate) => candidate.id === userId);
  if (!user) {
    const databaseUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!databaseUser) throw new Error("Cannot create a session for an unknown user.");
    const token = signSession(databaseUser, expiresAt);
    (await cookies()).set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/"
    });
    return;
  }
  const token = signSession(user, expiresAt);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSession(token);
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function findFallbackUser(nid: string, password: string) {
  if (fallbackUsers.size === 0) {
    const passwordHash = await bcrypt.hash("Demo@1234", 12);
    fallbackUsers.set("1987654321098", {
      id: "fallback-demo-user",
      nid: "1987654321098",
      name: "Demo Citizen",
      passwordHash
    });
  }
  const user = fallbackUsers.get(nid);
  return user && await bcrypt.compare(password, user.passwordHash) ? user : null;
}
