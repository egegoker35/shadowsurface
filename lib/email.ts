import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(email: string, token: string) {
  if (!resend) {
    console.log(`[DEV] Verify email: ${email} -> ${process.env.APP_URL}/verify?token=${token}`);
    return;
  }
  const url = `${process.env.APP_URL}/verify?token=${token}`;
  await resend.emails.send({
    from: 'ShadowSurface <verify@shadowsurface.com>',
    to: email,
    subject: 'Verify your ShadowSurface account',
    html: `<p>Click to verify: <a href="${url}">${url}</a></p>`,
  });
}
