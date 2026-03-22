import { Resend } from "resend";
import { DEFAULT_STORE_SETTINGS } from "@/lib/default-store-settings";
import { getStoreSettings } from "@/lib/store-settings";
import type { ContactMessage } from "@/types";

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  required?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getResendClient(required = false) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (required) {
      throw new Error("RESEND_API_KEY is missing. Add it to enable email replies.");
    }

    return null;
  }

  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "Smartest Store KE <onboarding@resend.dev>";
}

async function getSupportIdentity() {
  const settings = await getStoreSettings({ seedIfEmpty: true });

  return {
    supportEmail:
      settings?.supportEmail ||
      DEFAULT_STORE_SETTINGS.supportEmail ||
      "support@smarteststore.ke",
    adminEmail:
      settings?.adminNotificationEmail ||
      settings?.supportEmail ||
      DEFAULT_STORE_SETTINGS.adminNotificationEmail ||
      DEFAULT_STORE_SETTINGS.supportEmail ||
      "support@smarteststore.ke",
  };
}

async function sendEmail(options: SendEmailOptions) {
  const resend = getResendClient(options.required);
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: getFromEmail(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
  });
}

function renderAdminNotificationEmail(message: ContactMessage) {
  const subject = escapeHtml(message.subject);
  const name = escapeHtml(message.name);
  const email = escapeHtml(message.email);
  const body = escapeHtml(message.message);

  return `
    <div style="font-family:Inter,Segoe UI,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
      <div style="max-width:640px;margin:0 auto;border:1px solid #1e293b;border-radius:24px;background:#111827;padding:24px;">
        <p style="margin:0 0 6px;color:#fb923c;font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;">
          New Contact Message
        </p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;">${subject}</h1>
        <div style="margin-top:18px;border:1px solid #1f2937;border-radius:18px;background:#0b1221;padding:18px;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.14em;">Sender</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;">${name}</p>
          <p style="margin:6px 0 0;color:#cbd5e1;">${email}</p>
        </div>
        <div style="margin-top:18px;border:1px solid #1f2937;border-radius:18px;background:#0b1221;padding:18px;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.14em;">Message</p>
          <p style="margin:0;white-space:pre-wrap;line-height:1.8;color:#e2e8f0;">${body}</p>
        </div>
      </div>
    </div>
  `;
}

function renderReplyEmail(message: ContactMessage, replyMessage: string, supportEmail: string) {
  const subject = escapeHtml(message.subject);
  const name = escapeHtml(message.name);
  const body = escapeHtml(replyMessage);
  const email = escapeHtml(supportEmail);

  return `
    <div style="font-family:Inter,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;padding:24px;">
      <div style="max-width:640px;margin:0 auto;border:1px solid #e2e8f0;border-radius:24px;background:#ffffff;padding:24px;">
        <p style="margin:0 0 6px;color:#f97316;font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;">
          Smartest Store KE Support
        </p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;color:#111827;">Re: ${subject}</h1>
        <p style="margin:18px 0 0;line-height:1.8;color:#475569;">Hi ${name},</p>
        <div style="margin-top:18px;border-radius:18px;background:#fff7ed;border:1px solid #fdba74;padding:18px;">
          <p style="margin:0;white-space:pre-wrap;line-height:1.9;color:#7c2d12;">${body}</p>
        </div>
        <p style="margin:18px 0 0;line-height:1.8;color:#475569;">
          If you need to add more details, just reply to this email and our team will pick it up.
        </p>
        <p style="margin:18px 0 0;line-height:1.7;color:#0f172a;">
          Smartest Store KE Support<br />
          <a href="mailto:${email}" style="color:#f97316;text-decoration:none;">${email}</a>
        </p>
      </div>
    </div>
  `;
}

export async function sendContactMessageNotification(message: ContactMessage) {
  const { adminEmail } = await getSupportIdentity();

  await sendEmail({
    to: adminEmail,
    subject: `New contact message: ${message.subject}`,
    html: renderAdminNotificationEmail(message),
    replyTo: message.email,
    required: false,
  });
}

export async function sendContactReply(message: ContactMessage, replyMessage: string) {
  const { supportEmail } = await getSupportIdentity();

  await sendEmail({
    to: message.email,
    subject: `Re: ${message.subject}`,
    html: renderReplyEmail(message, replyMessage, supportEmail),
    replyTo: supportEmail,
    required: true,
  });
}
