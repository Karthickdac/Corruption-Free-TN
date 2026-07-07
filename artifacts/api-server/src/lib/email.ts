/**
 * Email notification helper.
 * Sends email when SMTP_HOST + SMTP_USER + SMTP_PASS are configured.
 * Falls back to console logging in development/when not configured.
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  const port = Number(process.env["SMTP_PORT"] ?? 587);
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  try {
    const t = getTransporter();
    if (!t) {
      console.log(`[email] To: ${opts.to} | Subject: ${opts.subject}`);
      return;
    }
    await t.sendMail({
      from: process.env["SMTP_FROM"] ?? process.env["SMTP_USER"],
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}
