import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/app/lib/auth";
import { runDigestJob } from "@/app/lib/push-jobs";

export async function POST(req: NextRequest) {
  const denied = requireCronAuth(req);
  if (denied) return denied;

  return NextResponse.json(await runDigestJob());
}
