import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

const scheduleEventSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    dayOfWeek: z
      .enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])
      .optional(),
    specificDate: z.string().datetime().optional(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // "HH:mm"
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    color: z.string().optional(),
  })
  .refine((data) => !!data.dayOfWeek !== !!data.specificDate, {
    message: "Fournir soit dayOfWeek (récurrent), soit specificDate (ponctuel), pas les deux",
  });

// GET /api/schedule
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const { searchParams } = new URL(req.url);
  const dayOfWeek = searchParams.get("dayOfWeek");

  const events = await prisma.scheduleEvent.findMany({
    where: {
      userId,
      isActive: true,
      ...(dayOfWeek ? { dayOfWeek: dayOfWeek as any } : {}),
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(events);
}

// POST /api/schedule
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();

  const parsed = scheduleEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.scheduleEvent.create({
    data: {
      ...parsed.data,
      specificDate: parsed.data.specificDate ? new Date(parsed.data.specificDate) : undefined,
      userId,
    },
  });

  return NextResponse.json(event, { status: 201 });
}