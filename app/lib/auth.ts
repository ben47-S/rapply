import { NextRequest } from "next/server";

export function getUserId(req: NextRequest): string {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new Error("UNAUTHENTICATED");
  }

  return userId;
}