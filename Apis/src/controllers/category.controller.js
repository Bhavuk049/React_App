import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export async function listCategories(req, res) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  res.json({ categories });
}

export async function getCategory(req, res) {
  const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }
  res.json({ category });
}

export async function createCategory(req, res) {
  const data = categorySchema.parse(req.body);
  const category = await prisma.category.create({ data });
  res.status(201).json({ category });
}

export async function updateCategory(req, res) {
  const data = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ category });
}

export async function deleteCategory(req, res) {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
