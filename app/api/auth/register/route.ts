import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return NextResponse.json(
    { error: "Registration is disabled for this hackathon demo. Use the supplied synthetic demo account." },
    { status: 403 }
  );
}
