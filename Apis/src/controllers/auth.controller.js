import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { createOtp, verifyOtp } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/mailer.js";

// Emails are normalized to lowercase everywhere so the same address can't create duplicate
// accounts just by differing in case (e.g. "Foo@example.com" vs "foo@example.com").
const emailField = z.string().trim().toLowerCase().email();

const requestOtpSchema = z.object({
  email: emailField,
});

const verifyOtpSchema = z.object({
  email: emailField,
  code: z.string().length(6),
});

const adminLoginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
});

const OTP_FAILURE_MESSAGES = {
  not_found: "Request a new code — none is pending for this email.",
  expired: "This code has expired. Request a new one.",
  too_many_attempts: "Too many incorrect attempts. Request a new code.",
  incorrect: "Incorrect code.",
};

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function requestOtp(req, res) {
  const { email } = requestOtpSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.role === "ADMIN") {
    // Admin accounts already have a password — skip OTP entirely.
    return res.json({ status: "password_required" });
  }

  const code = await createOtp(email);
  const { delivered } = await sendOtpEmail(email, code);

  res.json({
    status: "otp_sent",
    // Only surfaced when no real mail transport is configured, so the flow stays testable locally.
    devCode: delivered ? undefined : code,
  });
}

export async function verifyOtpCode(req, res) {
  const { email, code } = verifyOtpSchema.parse(req.body);

  const result = await verifyOtp(email, code);
  if (!result.valid) {
    return res.status(400).json({ error: OTP_FAILURE_MESSAGES[result.reason] ?? "Invalid code." });
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: { email, role: "CUSTOMER", emailVerifiedAt: new Date() },
    });
  } else if (!user.emailVerifiedAt) {
    user = await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.json({ status: "authenticated", user: toPublicUser(user), accessToken, refreshToken });
}

export async function adminLogin(req, res) {
  const { email, password } = adminLoginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN" || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  res.json({ user: toPublicUser(user), accessToken, refreshToken });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    include: { addresses: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ user: toPublicUser(user) });
}
