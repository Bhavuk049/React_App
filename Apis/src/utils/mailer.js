import nodemailer from "nodemailer";

let transporter = null;
let usingRealTransport = false;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (process.env.NODE_ENV === "production" && SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    usingRealTransport = true;
  } else {
    // Dev fallback: outside production (or SMTP unconfigured), just log the email instead of sending it
    // — keeps testing free and avoids hammering a real inbox with repeated OTPs.
    transporter = { sendMail: async (mail) => console.log(`[mailer:dev] to=${mail.to} subject="${mail.subject}"\n${mail.text}`) };
    usingRealTransport = false;
  }

  return transporter;
}

export async function sendOtpEmail(email, code) {
  const mail = {
    from: process.env.MAIL_FROM || "TheUniqPick <no-reply@theuniqpick.local>",
    to: email,
    subject: "Your TheUniqPick verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  };

  await getTransporter().sendMail(mail);
  return { delivered: usingRealTransport };
}
