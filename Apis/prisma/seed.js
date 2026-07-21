import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  await prisma.user.upsert({
    where: { email: "admin@uniqpick.com" },
    update: {},
    create: {
      firstName: "Admin",
      email: "admin@uniqpick.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });

  const categories = [
    { name: "Apparel", slug: "apparel", description: "Clothing and wearables", isActive: true },
    { name: "Accessories", slug: "accessories", description: "Bags, belts, and more", isActive: true },
    { name: "Home & Living", slug: "home-living", description: "Decor and everyday essentials", isActive: true },
  ];

  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const apparel = await prisma.category.findUniqueOrThrow({ where: { slug: "apparel" } });
  const accessories = await prisma.category.findUniqueOrThrow({ where: { slug: "accessories" } });
  const home = await prisma.category.findUniqueOrThrow({ where: { slug: "home-living" } });

  const products = [
    {
      name: "Classic Cotton Tee",
      slug: "classic-cotton-tee",
      description: "A soft, breathable everyday t-shirt.",
      price: 599,
      compareAtPrice: 799,
      stock: 120,
      images: ["https://placehold.co/600x600?text=Classic+Tee"],
      isFeatured: true,
      isActive: true,
      categoryId: apparel.id,
    },
    {
      name: "Denim Jacket",
      slug: "denim-jacket",
      description: "Durable denim jacket for all seasons.",
      price: 1999,
      stock: 40,
      images: ["https://placehold.co/600x600?text=Denim+Jacket"],
      isActive: true,
      categoryId: apparel.id,
    },
    {
      name: "Leather Wallet",
      slug: "leather-wallet",
      description: "Handcrafted genuine leather wallet.",
      price: 899,
      stock: 75,
      images: ["https://placehold.co/600x600?text=Leather+Wallet"],
      isFeatured: true,
      isActive: true,
      categoryId: accessories.id,
    },
    {
      name: "Canvas Tote Bag",
      slug: "canvas-tote-bag",
      description: "Spacious and sturdy everyday tote.",
      price: 699,
      stock: 60,
      images: ["https://placehold.co/600x600?text=Tote+Bag"],
      isActive: true,
      categoryId: accessories.id,
    },
    {
      name: "Ceramic Mug Set",
      slug: "ceramic-mug-set",
      description: "Set of 2 handcrafted ceramic mugs.",
      price: 499,
      stock: 100,
      images: ["https://placehold.co/600x600?text=Mug+Set"],
      isFeatured: true,
      isActive: true,
      categoryId: home.id,
    },
    {
      name: "Cotton Throw Blanket",
      slug: "cotton-throw-blanket",
      description: "Cozy woven throw blanket for any room.",
      price: 1299,
      stock: 30,
      images: ["https://placehold.co/600x600?text=Throw+Blanket"],
      isActive: true,
      categoryId: home.id,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  console.log("Seed complete. Admin login: admin@uniqpick.com / Admin@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
