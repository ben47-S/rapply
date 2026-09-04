import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
});

const stepSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().nonnegative(),
  instruction: z.string().min(1),
  duration: z.number().int().nonnegative().optional().nullable(),
});

const recipeSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  servings: z.number().int().positive().optional().nullable(),
  prepTime: z.number().int().nonnegative().optional().nullable(),
  cookTime: z.number().int().nonnegative().optional().nullable(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().nullable(),
  estimatedCost: z.number().positive().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  noteId: z.string().optional().nullable(),
  ingredients: z.array(ingredientSchema).optional(),
  steps: z.array(stepSchema).optional(),
});

// GET /api/recipes/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const recipe = await prisma.recipe.findFirst({
    where: { id: id, userId },
    include: { ingredients: true, steps: true },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(recipe);
}

// PUT /api/recipes/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);
  const body = await req.json();

  const existing = await prisma.recipe.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

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
    if (taken && taken.id !== id) {
      return NextResponse.json(
        { error: "Cette note est déjà liée à une autre recette" },
        { status: 400 }
      );
    }
  }

  const recipe = await prisma.$transaction(async (tx) => {
    const updated = await tx.recipe.update({
      where: { id: id },
      data: {
        ...rest,
        noteId: noteId === null ? null : noteId || undefined,
      },
    });

    if (ingredients) {
      const existingIngs = await tx.ingredient.findMany({
        where: { recipeId: id },
        select: { id: true },
      });
      const ownedIngIds = new Set(existingIngs.map((i) => i.id));

      const keptIds = ingredients
        .map((i) => i.id)
        .filter((x): x is string => !!x && ownedIngIds.has(x));
      await tx.ingredient.deleteMany({
        where: { recipeId: id, NOT: { id: { in: keptIds } } },
      });
      for (const ing of ingredients) {
        if (ing.id && ownedIngIds.has(ing.id)) {
          await tx.ingredient.update({
            where: { id: ing.id },
            data: { name: ing.name, quantity: ing.quantity ?? null, unit: ing.unit ?? null },
          });
        } else if (!ing.id) {
          await tx.ingredient.create({
            data: { recipeId: id, name: ing.name, quantity: ing.quantity ?? null, unit: ing.unit ?? null },
          });
        }
      }
    }

    if (steps) {
      const existingSteps = await tx.step.findMany({
        where: { recipeId: id },
        select: { id: true },
      });
      const ownedStepIds = new Set(existingSteps.map((s) => s.id));

      const keptIds = steps
        .map((s) => s.id)
        .filter((x): x is string => !!x && ownedStepIds.has(x));
      await tx.step.deleteMany({
        where: { recipeId: id, NOT: { id: { in: keptIds } } },
      });
      for (const s of steps) {
        if (s.id && ownedStepIds.has(s.id)) {
          await tx.step.update({
            where: { id: s.id },
            data: { order: s.order, instruction: s.instruction, duration: s.duration ?? null },
          });
        } else if (!s.id) {
          await tx.step.create({
            data: { recipeId: id, order: s.order, instruction: s.instruction, duration: s.duration ?? null },
          });
        }
      }
    }

    return tx.recipe.findUnique({
      where: { id: id },
      include: { ingredients: true, steps: true },
    });
  });

  return NextResponse.json(recipe);
}

// DELETE /api/recipes/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const existing = await prisma.recipe.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.recipe.delete({ where: { id: id } });

  return NextResponse.json({ success: true });
}
