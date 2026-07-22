import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { prisma } from "../lib/prisma.js";

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(30000),
});

// Admin-authored content is rendered as raw HTML for every customer who visits this page,
// so it's sanitized server-side too — a compromised admin session shouldn't be able to
// store a <script> tag that then runs in every visitor's browser.
const SANITIZE_OPTIONS = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "h4", "a", "blockquote"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

function sanitizeContent(html) {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

export async function listLegalPages(req, res) {
  const pages = await prisma.legalPage.findMany({
    select: { slug: true, title: true },
    orderBy: { title: "asc" },
  });
  res.json({ pages });
}

export async function getLegalPage(req, res) {
  const page = await prisma.legalPage.findUnique({ where: { slug: req.params.slug } });
  if (!page) {
    return res.status(404).json({ error: "Page not found" });
  }
  res.json({ page });
}

export async function adminListLegalPages(req, res) {
  const pages = await prisma.legalPage.findMany({ orderBy: { title: "asc" } });
  res.json({ pages });
}

export async function adminUpdateLegalPage(req, res) {
  const data = updateSchema.parse(req.body);

  const existing = await prisma.legalPage.findUnique({ where: { slug: req.params.slug } });
  if (!existing) {
    return res.status(404).json({ error: "Page not found" });
  }

  const page = await prisma.legalPage.update({
    where: { slug: req.params.slug },
    data: { ...data, content: sanitizeContent(data.content) },
  });
  res.json({ page });
}
