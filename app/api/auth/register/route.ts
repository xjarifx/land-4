import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { isDatabaseUnavailable, prisma } from "@/lib/prisma";
import { createFallbackUser, createSession } from "@/lib/auth";

const schema = z.object({ nid: z.string().regex(/^\d{10,20}$/), name: z.string().trim().min(2).max(80), password: z.string().min(8) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Use a valid NID, name, and password (8+ characters)." }, { status: 400 });
  let exists;
  try {
    exists = await prisma.user.findUnique({ where: { nid: parsed.data.nid } });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const user = await createFallbackUser(parsed.data.nid, parsed.data.name, parsed.data.password);
      if (!user) return NextResponse.json({ error: "An account already exists for this NID." }, { status: 409 });
      await createSession(user.id);
      return NextResponse.json({ ok: true, offline: true }, { status: 201 });
    }
    throw error;
  }
  if (exists) return NextResponse.json({ error: "An account already exists for this NID." }, { status: 409 });
  let user;
  try {
    user = await prisma.user.create({ data: { nid: parsed.data.nid, name: parsed.data.name, passwordHash: await bcrypt.hash(parsed.data.password, 12) } });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({ error: "Database is unavailable. Start Docker Desktop, then run `docker compose up -d` and `npm run db:push`." }, { status: 503 });
    }
    throw error;
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true }, { status: 201 });
}
