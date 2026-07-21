export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

// Known table prefixes (longest first) so "order_items_productId_key" doesn't get
// mis-split at "order_" before "order_items_" is tried.
const TABLE_PREFIXES = [
  "order_items_",
  "cart_items_",
  "email_otps_",
  "products_",
  "categories_",
  "addresses_",
  "orders_",
  "users_",
].sort((a, b) => b.length - a.length);

// Prisma 7's driver-adapter client doesn't populate err.meta.target for Postgres unique
// violations — the column name has to be pulled out of the underlying pg error message.
function extractDuplicateField(err) {
  if (err.meta?.target) return err.meta.target;

  const message = err.meta?.driverAdapterError?.cause?.originalMessage;
  const match = message?.match(/unique constraint "([^"]+)"/);
  if (!match) return "value";

  let field = match[1].replace(/_key$/, "");
  const prefix = TABLE_PREFIXES.find((p) => field.startsWith(p));
  if (prefix) field = field.slice(prefix.length);

  return field;
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ZodError") {
    return res.status(400).json({ error: "Validation failed", issues: err.issues });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ error: `Duplicate value for ${extractDuplicateField(err)}` });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
}
