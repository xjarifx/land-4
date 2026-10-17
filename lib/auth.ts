import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { isDatabaseUnavailable, prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "nid_session";
const SESSION_DAYS = 7;
type AuthUser = { id: string; nid: string; name: string; passwordHash: string };

const fallbackUsers = new Map<string, AuthUser>();
const fallbackSessions = new Map<string, AuthUser>();

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  try {
    await prisma.session.create({ data: { userId, tokenHash: hashToken(token), expiresAt } });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    const user = [...fallbackUsers.values()].find((candidate) => candidate.id === userId);
    if (!user) throw error;
    fallbackSessions.set(token, user);
  }
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

  const fallbackUser = fallbackSessions.get(token);
  if (fallbackUser) return fallbackUser;

  let session;
  try {
    session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true }
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    return fallbackSessions.get(token) ?? null;
  }

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    fallbackSessions.delete(token);
    try {
      await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) throw error;
    }
  }
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
