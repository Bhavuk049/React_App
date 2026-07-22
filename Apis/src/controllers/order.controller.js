import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const checkoutSchema = z
  .object({
    deliveryMethod: z.enum(["HOME_DELIVERY", "PICKUP"]).default("HOME_DELIVERY"),
    addressId: z.string().uuid().optional(),
    contactPhone: z.string().regex(/^\d{10}$/, "Enter a 10-digit phone number").optional(),
    paymentMethod: z.enum(["COD", "UPI", "CARD"]),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce.number().int().min(1),
        }),
      )
      .min(1),
  })
  .refine((data) => data.deliveryMethod !== "HOME_DELIVERY" || !!data.addressId, {
    message: "Select a delivery address",
    path: ["addressId"],
  })
  .refine((data) => data.deliveryMethod !== "PICKUP" || !!data.contactPhone, {
    message: "Enter a 10-digit phone number",
    path: ["contactPhone"],
  });

const USER_SELECT = { id: true, email: true, firstName: true, lastName: true, phone: true };

export async function createOrder(req, res) {
  const { deliveryMethod, addressId, contactPhone, paymentMethod, items } = checkoutSchema.parse(req.body);

  if (deliveryMethod === "HOME_DELIVERY") {
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== req.user.sub) {
      return res.status(404).json({ error: "Address not found" });
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || !product.isActive) {
      return res.status(400).json({ error: "One of the items in your cart is no longer available." });
    }
    if (product.stock < item.quantity) {
      return res.status(409).json({ error: `${product.name} only has ${product.stock} left in stock.` });
    }
  }

  const subtotal = items.reduce((sum, item) => sum + Number(productById.get(item.productId).price) * item.quantity, 0);
  const shippingFee = 0;
  const total = subtotal + shippingFee;
  // UPI/CARD are paid instantly (simulated); COD is unpaid until collected on delivery.
  const isPaid = paymentMethod !== "COD";

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: req.user.sub,
        deliveryMethod,
        addressId: deliveryMethod === "HOME_DELIVERY" ? addressId : null,
        contactPhone: deliveryMethod === "PICKUP" ? contactPhone : null,
        paymentMethod,
        isPaid,
        subtotal,
        shippingFee,
        total,
        items: {
          create: items.map((item) => {
            const product = productById.get(item.productId);
            return {
              productId: product.id,
              name: product.name,
              price: product.price,
              quantity: item.quantity,
              gstRate: product.gstRate,
              gstInclusive: product.gstInclusive,
            };
          }),
        },
      },
      include: { items: true, address: true },
    });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  res.status(201).json({ order });
}

const posSaleSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce.number().int().min(1),
        }),
      )
      .min(1),
    charges: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(100),
          amount: z.coerce.number().min(0),
          gstRate: z.coerce.number().min(0).max(100).default(0),
        }),
      )
      .optional(),
    paymentMethod: z.enum(["CASH", "UPI", "UPI_PERSONAL", "CARD"]),
    customerId: z.string().uuid().optional(),
    guestName: z.string().trim().max(100).optional(),
    guestPhone: z.string().regex(/^\d{10}$/, "Enter a 10-digit phone number").optional().or(z.literal("")),
    discountType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
    discountValue: z.coerce.number().min(0).optional(),
    roundOffAmount: z.coerce.number().optional(),
  })
  .refine((data) => !data.discountType || data.discountType !== "PERCENTAGE" || (data.discountValue ?? 0) <= 100, {
    message: "Percentage discount can't exceed 100%",
    path: ["discountValue"],
  });

export async function createPosSale(req, res) {
  const data = posSaleSchema.parse(req.body);

  if (data.customerId) {
    const customer = await prisma.user.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((item) => item.productId) } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  for (const item of data.items) {
    const product = productById.get(item.productId);
    if (!product) {
      return res.status(400).json({ error: "One of the selected products no longer exists." });
    }
    if (product.stock < item.quantity) {
      return res.status(409).json({ error: `${product.name} only has ${product.stock} left in stock.` });
    }
  }

  const productsSubtotal = data.items.reduce(
    (sum, item) => sum + Number(productById.get(item.productId).price) * item.quantity,
    0,
  );
  const charges = data.charges ?? [];
  const chargesSubtotal = charges.reduce((sum, charge) => sum + charge.amount, 0);
  const subtotal = productsSubtotal + chargesSubtotal;

  let discountAmount = 0;
  if (data.discountType && data.discountValue) {
    discountAmount =
      data.discountType === "PERCENTAGE" ? (subtotal * data.discountValue) / 100 : data.discountValue;
    discountAmount = Math.round(Math.min(discountAmount, subtotal) * 100) / 100;
  }
  const roundOffAmount = Math.round((data.roundOffAmount ?? 0) * 100) / 100;
  const total = Math.round((subtotal - discountAmount + roundOffAmount) * 100) / 100;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: data.customerId ?? null,
        channel: "POS",
        guestName: data.customerId ? null : data.guestName || null,
        guestPhone: data.customerId ? null : data.guestPhone || null,
        paymentMethod: data.paymentMethod,
        isPaid: true,
        status: "DELIVERED",
        subtotal,
        discountType: discountAmount > 0 ? data.discountType : null,
        discountValue: discountAmount > 0 ? data.discountValue : null,
        discountAmount,
        roundOffAmount,
        shippingFee: 0,
        total,
        items: {
          create: [
            ...data.items.map((item) => {
              const product = productById.get(item.productId);
              return {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                gstRate: product.gstRate,
                gstInclusive: product.gstInclusive,
              };
            }),
            ...charges.map((charge) => ({
              productId: null,
              name: charge.name,
              price: charge.amount,
              quantity: 1,
              gstRate: charge.gstRate,
              gstInclusive: true,
            })),
          ],
        },
      },
      include: { user: { select: USER_SELECT }, address: true, items: true },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  res.status(201).json({ order });
}

export async function listMyOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.sub },
    include: { address: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ orders });
}

export async function getMyOrder(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { address: true, items: { include: { product: { select: { images: true } } } } },
  });

  if (!order || order.userId !== req.user.sub) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json({ order });
}

export async function adminGetOrder(req, res) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: USER_SELECT },
      address: true,
      items: { include: { product: { select: { images: true } } } },
    },
  });

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json({ order });
}

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

const updatePaymentStatusSchema = z.object({
  isPaid: z.boolean(),
});

export async function adminUpdateOrderPaymentStatus(req, res) {
  const { isPaid } = updatePaymentStatusSchema.parse(req.body);

  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { isPaid },
    include: { user: { select: USER_SELECT }, address: true, items: true },
  });

  res.json({ order });
}

const updateTrackingSchema = z.object({
  trackingCompany: z.string().trim().max(100).optional().or(z.literal("")),
  trackingId: z.string().trim().max(100).optional().or(z.literal("")),
});

export async function adminUpdateOrderTracking(req, res) {
  const data = updateTrackingSchema.parse(req.body);

  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: "Order not found" });
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      trackingCompany: data.trackingCompany ? data.trackingCompany : null,
      trackingId: data.trackingId ? data.trackingId : null,
    },
    include: { user: { select: USER_SELECT }, address: true, items: true },
  });

  res.json({ order });
}

export async function adminUpdateOrderStatus(req, res) {
  const { status } = updateOrderStatusSchema.parse(req.body);

  const current = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!current) {
    return res.status(404).json({ error: "Order not found" });
  }

  const wasCancelled = current.status === "CANCELLED";
  const willBeCancelled = status === "CANCELLED";

  if (wasCancelled && !willBeCancelled) {
    // Re-activating a cancelled order: the stock was returned when it was cancelled,
    // so it needs to be taken back out — but only if there's enough left.
    const products = await prisma.product.findMany({
      where: { id: { in: current.items.map((item) => item.productId) } },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    for (const item of current.items) {
      const product = productById.get(item.productId);
      if (!product || product.stock < item.quantity) {
        return res.status(409).json({
          error: `Can't restore this order — ${product?.name ?? "a product"} no longer has enough stock.`,
        });
      }
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    if (willBeCancelled && !wasCancelled) {
      for (const item of current.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
    } else if (wasCancelled && !willBeCancelled) {
      for (const item of current.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
    }

    return tx.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { user: { select: USER_SELECT }, address: true, items: true },
    });
  });

  res.json({ order });
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  return addDays(d, diff);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const dashboardStatsQuerySchema = z.object({
  monthOffset: z.coerce.number().int().min(-120).max(0).default(0),
});

export async function adminDashboardStats(req, res) {
  const { monthOffset } = dashboardStatsQuerySchema.parse(req.query);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);
  const currentWeekStart = startOfWeek(now);
  const currentWeekEnd = addDays(currentWeekStart, 7);
  const chartMonthStart = addMonths(startOfMonth(now), monthOffset);
  const chartMonthEnd = addMonths(chartMonthStart, 1);
  const totalDaysInMonth = daysInMonth(chartMonthStart);

  const [todayAgg, weekAgg, chartOrders, products] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: todayStart, lt: todayEnd } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: currentWeekStart, lt: currentWeekEnd } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: chartMonthStart, lt: chartMonthEnd } },
      select: { total: true, createdAt: true },
    }),
    prisma.product.findMany({ select: { stock: true, price: true } }),
  ]);

  const totalStockValue = products.reduce((sum, product) => sum + product.stock * Number(product.price), 0);

  const dailyTotals = new Map();
  for (let i = 0; i < totalDaysInMonth; i += 1) {
    dailyTotals.set(toDateString(addDays(chartMonthStart, i)), 0);
  }
  for (const order of chartOrders) {
    const key = toDateString(order.createdAt);
    if (dailyTotals.has(key)) {
      dailyTotals.set(key, dailyTotals.get(key) + Number(order.total));
    }
  }

  res.json({
    todayTotal: todayAgg._sum.total ?? 0,
    weekTotal: weekAgg._sum.total ?? 0,
    totalStockValue,
    chart: {
      monthOffset,
      startDate: toDateString(chartMonthStart),
      endDate: toDateString(addDays(chartMonthStart, totalDaysInMonth - 1)),
      isCurrentMonth: monthOffset === 0,
      days: Array.from(dailyTotals.entries()).map(([date, total]) => ({ date, total })),
    },
  });
}

const adminListOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.union([z.coerce.number().int().min(1).max(500), z.literal("all")]).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  channel: z.enum(["ONLINE", "POS"]).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
});

export async function adminListOrders(req, res) {
  const { page, pageSize, startDate, endDate, channel, status } = adminListOrdersQuerySchema.parse(req.query);

  const where = {
    ...(channel ? { channel } : {}),
    ...(status ? { status } : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: new Date(`${startDate}T00:00:00.000Z`) } : {}),
            ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const isAll = pageSize === "all";

  const [orders, total, amountAgg] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: { select: USER_SELECT }, address: true, items: true },
      orderBy: { createdAt: "desc" },
      ...(isAll ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { total: true } }),
  ]);

  res.json({
    orders,
    pagination: {
      page: isAll ? 1 : page,
      pageSize: isAll ? total : pageSize,
      total,
      totalPages: isAll ? 1 : Math.max(1, Math.ceil(total / pageSize)),
    },
    totalAmount: amountAgg._sum.total ?? 0,
  });
}
