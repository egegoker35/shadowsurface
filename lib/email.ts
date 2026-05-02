import { Resend } from 'resend';
import { createTransport } from 'nodemailer';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const smtpTransporter = process.env.SMTP_HOST ? createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
}) : null;

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const from = process.env.EMAIL_FROM || 'ShadowSurface <noreply@shadowsurface.app>';

  // Try Resend first
  if (resend) {
    try {
      await resend.emails.send({ from, to, subject, html });
      console.log(`[Email] Sent via Resend to ${to}`);
      return;
    } catch (e: any) {
      console.error('[Email] Resend failed:', e.message);
    }
  }

  // Try SMTP fallback
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({ from, to, subject, html });
      console.log(`[Email] Sent via SMTP to ${to}`);
      return;
    } catch (e: any) {
      console.error('[Email] SMTP failed:', e.message);
    }
  }

  // Dev fallback: log to console
  console.log(`[DEV Email] To: ${to} | Subject: ${subject}`);
  console.log(`[DEV Email] Body: ${html}`);
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://shadowsurface.app';
  const url = `${baseUrl}/verify?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your ShadowSurface account',
    html: `<p>Welcome to ShadowSurface!</p><p>Click to verify your account: <a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://shadowsurface.app';
  const url = `${baseUrl}/reset-password?token=${token}`;
  console.log(`[Password Reset] Generated URL: ${url}`);
  await sendEmail({
    to: email,
    subject: 'Reset your ShadowSurface password',
    html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;"><h2 style="color:#10b981;">ShadowSurface Password Reset</h2><p>You requested a password reset. Click the button below to set a new password:</p><p style="text-align:center;margin:30px 0;"><a href="${url}" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Reset Password</a></p><p style="color:#666;font-size:12px;">Or copy this link: <a href="${url}">${url}</a></p><p style="color:#999;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p></div>`,
  });
}
