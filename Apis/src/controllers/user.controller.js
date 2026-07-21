import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const phoneField = z.string().regex(/^\d{10}$/, "Enter a 10-digit phone number");

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: phoneField.optional(),
});

const addressSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits"),
  phone: phoneField,
  isDefault: z.boolean().optional(),
});

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function updateProfile(req, res) {
  const data = profileSchema.partial().parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user.sub },
    data,
    include: { addresses: true },
  });

  res.json({ user: toPublicUser(user) });
}

export async function listAddresses(req, res) {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.sub },
    orderBy: { createdAt: "desc" },
  });
  res.json({ addresses });
}

export async function createAddress(req, res) {
  const data = addressSchema.parse(req.body);

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.sub }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: { ...data, country: "India", userId: req.user.sub },
  });

  res.status(201).json({ address });
}

export async function updateAddress(req, res) {
  const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user.sub) {
    return res.status(404).json({ error: "Address not found" });
  }

  const data = addressSchema.partial().parse(req.body);

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.sub }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({
    where: { id: req.params.id },
    data: { ...data, country: "India" },
  });

  res.json({ address });
}

export async function deleteAddress(req, res) {
  const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.user.sub) {
    return res.status(404).json({ error: "Address not found" });
  }

  await prisma.address.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

export async function adminListUsers(req, res) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, addresses: true } } },
  });

  res.json({ users: users.map(toPublicUser) });
}

export async function adminGetUser(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { addresses: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const orders = await prisma.order.findMany({
    where: { userId: req.params.id },
    include: { address: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ user: toPublicUser(user), orders });
}
