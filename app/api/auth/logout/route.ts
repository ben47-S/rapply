import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  const isHttps =
    req.nextUrl.protocol === "https" ||
    req.headers.get("x-forwarded-proto") === "https";
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
