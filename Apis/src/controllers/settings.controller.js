import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const SETTINGS_ID = "store";

const EMPTY_SETTINGS = {
  supportPhone: null,
  supportEmail: null,
  gstNumber: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  country: "India",
};

// GSTIN: 2-digit state code + 10-char PAN + 1-digit entity code + "Z" + 1 checksum char.
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const settingsSchema = z.object({
  supportPhone: z.string().regex(/^\d{10}$/, "Enter a 10-digit phone number").optional().or(z.literal("")),
  supportEmail: z.string().trim().toLowerCase().email("Enter a valid email").optional().or(z.literal("")),
  gstNumber: z.string().trim().toUpperCase().regex(GSTIN_REGEX, "Enter a valid 15-character GSTIN").optional().or(z.literal("")),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().regex(/^\d{6}$/, "PIN code must be 6 digits").optional().or(z.literal("")),
});

const NULLABLE_FIELDS = [
  "supportPhone",
  "supportEmail",
  "gstNumber",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
];

function normalizeEmptyStrings(data) {
  for (const field of NULLABLE_FIELDS) {
    if (field in data && data[field] === "") {
      data[field] = null;
    }
  }
  return data;
}

export async function getSettings(req, res) {
  const settings = await prisma.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
  res.json({ settings: settings ?? EMPTY_SETTINGS });
}

export async function updateSettings(req, res) {
  const data = normalizeEmptyStrings(settingsSchema.partial().parse(req.body));

  const settings = await prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { ...data, country: "India" },
    create: { id: SETTINGS_ID, ...data, country: "India" },
  });

  res.json({ settings });
}
