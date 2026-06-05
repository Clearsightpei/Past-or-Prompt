import nodemailer from "nodemailer";

// SMTP is configured via env. If it's not set, we fall back to logging the
// email to the console so password reset still works in dev / before email
// infra is wired up.
const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || "Treehole Archive <no-reply@treehole.local>";

const transporter =
  host && user && pass
    ? nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })
    : null;

export const mailerConfigured = !!transporter;

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = "Reset your Treehole Archive password";
  const text = `Someone (hopefully you) asked to reset your password.\n\nReset it here (link expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`;
  const html = `<p>Someone (hopefully you) asked to reset your password.</p>
<p><a href="${resetUrl}">Click here to reset it</a> — the link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>`;

  if (!transporter) {
    console.log(`[mailer] SMTP not configured. Password reset link for ${to}:\n${resetUrl}`);
    return;
  }

  await transporter.sendMail({ from, to, subject, text, html });
}
