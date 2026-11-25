import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { validateWebhookUrl } from '@/lib/webhookUrl';

export type ScanEventPayload = {
  event: 'scan.completed' | 'scan.failed';
  scanId: string;
  target: string;
  overallRisk?: string | null;
  riskScore?: number | null;
  totalAssets?: number;
  totalCVEs?: number;
  durationSeconds?: number;
  error?: string;
};

/**
 * Deliver a scan event to every active webhook of the organization.
 *
 * The dashboard has always let users register webhook endpoints, and the model even
 * carried a secret and a lastStatus column, but nothing ever sent a request: an
 * integration that silently receives nothing is worse than no integration at all.
 * Delivery is best-effort, bounded to 5s per endpoint, and never blocks or fails the scan.
 */
export async function dispatchScanEvent(orgId: string, payload: ScanEventPayload): Promise<void> {
  try {
    const hooks = await prisma.webhook.findMany({ where: { orgId, active: true } });
    const matching = hooks.filter((hook) => {
      const events = Array.isArray(hook.events) ? hook.events : [];
      return events.length === 0 || events.includes(payload.event);
    });

    await Promise.allSettled(
      matching.map(async (hook) => {
        const body = JSON.stringify(payload);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'ShadowSurface-Webhook/1.0',
          'X-ShadowSurface-Event': payload.event,
        };
        if (hook.secret) {
          headers['X-ShadowSurface-Signature'] =
            'sha256=' + crypto.createHmac('sha256', hook.secret).update(body).digest('hex');
        }

        let status = 0;
        try {
          // Re-check at delivery time: rows created before validation existed must not be
          // fetched, and redirects are not followed so a 302 cannot bounce the request
          // into an internal address after validation.
          const check = await validateWebhookUrl(hook.url);
          if (!check.ok) {
            status = -1;
          } else {
            const res = await fetch(check.url!, {
              method: 'POST',
              headers,
              body,
              redirect: 'manual',
              signal: AbortSignal.timeout(5000),
            });
            status = res.status;
          }
        } catch {
          status = 0; // network error / timeout: record it instead of throwing
        }

        await prisma.webhook
          .update({ where: { id: hook.id }, data: { lastStatus: status } })
          .catch(() => {});
      }),
    );
  } catch {
    // Webhook delivery must never take a scan down.
  }
}
