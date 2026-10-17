import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { isDatabaseUnavailable, prisma } from "@/lib/prisma";
import { createSession, findFallbackUser } from "@/lib/auth";

const schema = z.object({ nid: z.string().regex(/^\d{10,20}$/), password: z.string().min(8) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid NID and password." }, { status: 400 });
  let user;
  try {
    user = await prisma.user.findUnique({ where: { nid: parsed.data.nid } });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      user = await findFallbackUser(parsed.data.nid, parsed.data.password);
      if (!user) return NextResponse.json({ error: "Use the demo account while the database is offline: 1987654321098 / Demo@1234." }, { status: 401 });
      await createSession(user.id);
      return NextResponse.json({ ok: true, offline: true });
    }
    throw error;
  }
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "NID or password is incorrect." }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
