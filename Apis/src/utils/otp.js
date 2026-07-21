import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const DEV_STATIC_OTP = "123456";

export function generateOtpCode() {
  if (process.env.NODE_ENV !== "production") {
    // Fixed code in development so testing the flow doesn't burn through real email sends.
    return DEV_STATIC_OTP;
  }
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

export async function createOtp(email) {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate any previous outstanding OTPs for this email so only the latest one works.
  await prisma.emailOtp.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.emailOtp.create({ data: { email, codeHash, expiresAt } });

  return code;
}

export async function verifyOtp(email, code) {
  const otp = await prisma.emailOtp.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { valid: false, reason: "not_found" };
  if (otp.expiresAt < new Date()) return { valid: false, reason: "expired" };
  if (otp.attempts >= MAX_ATTEMPTS) return { valid: false, reason: "too_many_attempts" };

  const matches = await bcrypt.compare(code, otp.codeHash);
  if (!matches) {
    await prisma.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { valid: false, reason: "incorrect" };
  }

  await prisma.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return { valid: true };
}
