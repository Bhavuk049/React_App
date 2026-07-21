import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import multer from "multer";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.join(__dirname, "../../uploads");
const productImagesDir = path.join(uploadsRoot, "products");

fs.mkdirSync(productImagesDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITY = 80;

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Only JPEG, PNG, WEBP, or GIF images are allowed");
    error.status = 400;
    return cb(error);
  }
  cb(null, true);
}

export const uploadProductImages = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
}).array("images", 5);

// Runs after uploadProductImages: shrinks + re-encodes each uploaded image to
// keep visual quality while cutting file size, so more images fit on disk.
export async function processProductImages(req, res, next) {
  if (!req.files || req.files.length === 0) return next();

  try {
    await Promise.all(
      req.files.map(async (file) => {
        // Animated GIFs would lose their animation if re-encoded as webp, so store as-is.
        const isGif = file.mimetype === "image/gif";
        const filename = `${crypto.randomUUID()}.${isGif ? "gif" : "webp"}`;

        if (isGif) {
          await fs.promises.writeFile(path.join(productImagesDir, filename), file.buffer);
        } else {
          await sharp(file.buffer)
            .rotate()
            .resize({
              width: MAX_IMAGE_DIMENSION,
              height: MAX_IMAGE_DIMENSION,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: WEBP_QUALITY })
            .toFile(path.join(productImagesDir, filename));
        }

        file.filename = filename;
      }),
    );
    next();
  } catch (err) {
    next(err);
  }
}
