import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  description: z.string().min(1),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  categoryId: z.string().uuid(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});

export async function listProducts(req, res) {
  const { page, pageSize, category, search, featured } = listQuerySchema.parse(req.query);

  const where = {
    isActive: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(featured ? { isFeatured: true } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" } }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function getProduct(req, res) {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { category: true },
  });
  if (!product || !product.isActive) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ product });
}

export async function createProduct(req, res) {
  const data = productSchema.parse(req.body);
  const product = await prisma.product.create({ data });
  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const data = productSchema.partial().parse(req.body);
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ product });
}

export async function deleteProduct(req, res) {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function adminListProducts(req, res) {
  const { page, pageSize, category, search } = listQuerySchema.parse(req.query);

  const where = {
    ...(category ? { category: { slug: category } } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
