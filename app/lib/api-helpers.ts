// app/lib/api-helpers.ts
import { NextResponse } from "next/server";

export function unauthorized() {
  return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
}