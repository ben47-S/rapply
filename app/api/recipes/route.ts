import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

const recipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  servings: z.number().int().positive().optional().nullable(),
  prepTime: z.number().int().nonnegative().optional().nullable(),
  cookTime: z.number().int().nonnegative().optional().nullable(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().nullable(),
  estimatedCost: z.number().positive().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  noteId: z.string().optional().nullable(),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.number().optional().nullable(),
        unit: z.string().optional().nullable(),
      })
    )
    .optional(),
  steps: z
    .array(
      z.object({
        order: z.number().int().nonnegative(),
        instruction: z.string().min(1),
        duration: z.number().int().nonnegative().optional().nullable(),
      })
    )
    .optional(),
});

// GET /api/recipes
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const recipes = await prisma.recipe.findMany({
    where: { userId },
    include: { ingredients: true, steps: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(recipes);
}

// POST /api/recipes
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();

  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { ingredients, steps, noteId, ...rest } = parsed.data;

  if (noteId) {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId },
    });
    if (!note) {
      return NextResponse.json({ error: "Note liée introuvable" }, { status: 400 });
    }
    const taken = await prisma.recipe.findUnique({ where: { noteId } });
    if (taken) {
      return NextResponse.json(
        { error: "Cette note est déjà liée à une autre recette" },
        { status: 400 }
      );
    }
  }

  const recipe = await prisma.recipe.create({
    data: {
      ...rest,
      noteId: noteId || undefined,
      ingredients: ingredients?.length
        ? { create: ingredients }
        : undefined,
      steps: steps?.length ? { create: steps } : undefined,
      userId,
    },
    include: { ingredients: true, steps: true },
  });

  return NextResponse.json(recipe, { status: 201 });
}
