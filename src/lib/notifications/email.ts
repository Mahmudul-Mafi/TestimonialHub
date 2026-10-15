import { Resend } from "resend";
import { appConfig } from "@/lib/app-config";

/**
 * Resend email client + send helpers.
 *
 * Email is sent synchronously inside the request handler. PRD §3.7
 * (FR-NOT-008) and grill Q4 require that email failures NEVER roll back
 * a successfully saved testimonial. The submission flow saves the row in
 * a transaction, then calls `sendOwnerNotification` outside the
 * transaction and logs (but does not throw on) failures.
 *
 * If `RESEND_API_KEY` is the placeholder value, we log to the console
 * instead of calling the network. This keeps local dev frictionless.
 */

const isPlaceholder =
  appConfig.resend.apiKey === "re_placeholder" ||
  appConfig.resend.apiKey.startsWith("re_") === false ||
  appConfig.resend.apiKey.length < 20;

const resend = isPlaceholder ? null : new Resend(appConfig.resend.apiKey);

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (resend === null) {
    // Local dev with placeholder key: log to console so the developer
    // can see what would have been sent.
    console.log(
      `[email:dev] to=${msg.to} subject=${JSON.stringify(msg.subject)}`
    );
    console.log(msg.text);
    return { ok: true, id: "dev-" + Date.now().toString(36) };
  }
  try {
    const result = await resend.emails.send({
      from: appConfig.resend.from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo ?? undefined,
    });
    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

/** HTML escape for interpolated values. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
