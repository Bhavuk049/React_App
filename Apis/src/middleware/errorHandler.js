export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ZodError") {
    return res.status(400).json({ error: "Validation failed", issues: err.issues });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ error: `Duplicate value for ${err.meta?.target}` });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
}
