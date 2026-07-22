import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { uploadsRoot } from "../middleware/upload.js";

const MAX_PRODUCT_IMAGES = 5;

const booleanString = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  description: z.string().min(1),
  price: z.coerce.number().positive(),
  purchasePrice: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  barcode: z.string().trim().max(64).optional(),
  gstRate: z.coerce.number().int().min(0).max(50).optional(),
  gstInclusive: booleanString,
  isActive: booleanString,
  isFeatured: booleanString,
  categoryId: z.string().uuid(),
});

// Empty barcode input should mean "no barcode" (null), not an empty string —
// several products with barcode="" would otherwise collide on the unique index.
function normalizeBarcode(data) {
  if ("barcode" in data) {
    data.barcode = data.barcode ? data.barcode : null;
  }
  return data;
}

function buildUploadedImageUrls(files) {
  return (files || []).map((file) => `/uploads/products/${file.filename}`);
}

async function deleteImageFiles(imageUrls) {
  await Promise.all(
    imageUrls
      .filter((url) => url.startsWith("/uploads/"))
      .map((url) => fs.unlink(path.join(uploadsRoot, url.replace("/uploads/", ""))).catch(() => {})),
  );
}

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
    category: {
      isActive: true,
      ...(category ? { slug: category } : {}),
    },
    ...(featured ? { isFeatured: true } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" } }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      omit: { purchasePrice: true },
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
    omit: { purchasePrice: true },
    include: { category: true },
  });
  if (!product || !product.isActive || !product.category.isActive) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ product });
}

export async function createProduct(req, res) {
  const data = normalizeBarcode(productSchema.parse(req.body));
  const images = buildUploadedImageUrls(req.files);

  if (images.length > MAX_PRODUCT_IMAGES) {
    return res.status(400).json({ error: `You can upload up to ${MAX_PRODUCT_IMAGES} images per product.` });
  }

  const product = await prisma.product.create({ data: { ...data, images } });
  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const current = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!current) {
    return res.status(404).json({ error: "Product not found" });
  }

  const bodyKeys = Object.keys(req.body);
  const isPublishToggleOnly =
    bodyKeys.length === 1 && bodyKeys[0] === "isActive" && (!req.files || req.files.length === 0);

  if (current.isActive && !isPublishToggleOnly) {
    return res.status(409).json({
      error: "Unpublish this product before editing it, then publish it again once you're done.",
    });
  }

  const data = normalizeBarcode(productSchema.partial().parse(req.body));
  const newImages = buildUploadedImageUrls(req.files);

  let existingImages = [];
  if (req.body.existingImages) {
    try {
      existingImages = JSON.parse(req.body.existingImages);
    } catch {
      return res.status(400).json({ error: "Invalid existingImages value" });
    }
  }

  const images = [...existingImages, ...newImages];
  if (images.length > MAX_PRODUCT_IMAGES) {
    return res.status(400).json({ error: `You can upload up to ${MAX_PRODUCT_IMAGES} images per product.` });
  }

  const replacingImages = req.body.existingImages !== undefined || newImages.length > 0;

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(replacingImages ? { images } : {}),
    },
  });

  if (replacingImages) {
    const droppedImages = current.images.filter((url) => !images.includes(url));
    await deleteImageFiles(droppedImages);
  }

  res.json({ product });
}

export async function deleteProduct(req, res) {
  const product = await prisma.product.delete({ where: { id: req.params.id } });
  await deleteImageFiles(product.images);
  res.status(204).send();
}

export async function adminGetProduct(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  // Product logs merge two sources: order items (stock reduced at checkout) and
  // manual stock adjustments made from the admin "Update stock" modal.
  const [orderReductions, manualAdjustments] = await Promise.all([
    prisma.orderItem.findMany({
      where: { productId: req.params.id },
      select: {
        id: true,
        quantity: true,
        order: {
          select: {
            id: true,
            createdAt: true,
            status: true,
            channel: true,
            guestName: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    }),
    prisma.productStockLog.findMany({
      where: { productId: req.params.id },
      select: {
        id: true,
        delta: true,
        createdAt: true,
        admin: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  const productLogs = [
    ...orderReductions.map((item) => ({
      type: "order",
      id: item.id,
      delta: -item.quantity,
      createdAt: item.order.createdAt,
      order: item.order,
    })),
    ...manualAdjustments.map((log) => ({
      type: "manual",
      id: log.id,
      delta: log.delta,
      createdAt: log.createdAt,
      admin: log.admin,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ product, productLogs });
}

const stockAdjustSchema = z.object({
  delta: z.coerce.number().int().refine((v) => v !== 0, "Enter a non-zero quantity"),
});

// Stock adjustments are independent of the publish lock — restocking or correcting
// inventory shouldn't require unpublishing a live product first.
export async function adminUpdateStock(req, res) {
  const { delta } = stockAdjustSchema.parse(req.body);

  const current = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!current) {
    return res.status(404).json({ error: "Product not found" });
  }
  if (current.stock + delta < 0) {
    return res.status(400).json({ error: `Cannot reduce stock below 0 (current stock: ${current.stock}).` });
  }

  const [product] = await prisma.$transaction([
    prisma.product.update({
      where: { id: req.params.id },
      data: { stock: { increment: delta } },
    }),
    prisma.productStockLog.create({
      data: { productId: req.params.id, delta, adminId: req.user.sub },
    }),
  ]);
  res.json({ product });
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
