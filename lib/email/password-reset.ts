import { Resend } from "resend";
import { getSupportContactInfo } from "@/lib/support-contact";

type SendPasswordResetEmailOptions = {
  to: string;
  name?: string | null;
  resetUrl: string;
  expiresInMinutes?: number;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is missing. Password reset emails are unavailable.");
    }

    return null;
  }

  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "Smartest Store KE <onboarding@resend.dev>";
}

function renderPasswordResetEmail({
  name,
  resetUrl,
  supportEmail,
  expiresInMinutes,
}: {
  name: string;
  resetUrl: string;
  supportEmail: string;
  expiresInMinutes: number;
}) {
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);
  const safeSupportEmail = escapeHtml(supportEmail);

  return `
    <div style="font-family:Inter,Segoe UI,sans-serif;background:#05060a;color:#e2e8f0;padding:24px;">
      <div style="max-width:640px;margin:0 auto;border:1px solid #1f2937;border-radius:28px;background:linear-gradient(145deg,#0f172a 0%,#111827 55%,#1f2937 100%);padding:32px;">
        <p style="margin:0 0 8px;color:#fdba74;font-size:12px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;">
          Smartest Store KE
        </p>
        <h1 style="margin:0;font-size:30px;line-height:1.2;color:#ffffff;">Reset your password</h1>
        <p style="margin:18px 0 0;line-height:1.8;color:#cbd5e1;">
          Hi ${safeName}, we received a request to reset your password. Use the button below to choose a new one.
        </p>
        <div style="margin-top:24px;">
          <a href="${safeResetUrl}" style="display:inline-block;border-radius:16px;background:#f97316;color:#ffffff;padding:14px 24px;text-decoration:none;font-weight:800;">
            Choose a new password
          </a>
        </div>
        <div style="margin-top:24px;border:1px solid rgba(253,186,116,0.25);border-radius:18px;background:rgba(15,23,42,0.55);padding:18px;">
          <p style="margin:0;color:#fdba74;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">
            Security note
          </p>
          <p style="margin:8px 0 0;line-height:1.8;color:#cbd5e1;">
            This link expires in ${expiresInMinutes} minutes and stops working after you successfully reset your password.
          </p>
        </div>
        <p style="margin:24px 0 0;line-height:1.8;color:#94a3b8;">
          If you did not request this change, you can safely ignore this email. Need help? Reach us at
          <a href="mailto:${safeSupportEmail}" style="color:#fdba74;text-decoration:none;"> ${safeSupportEmail}</a>.
        </p>
      </div>
    </div>
  `;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  expiresInMinutes = 60,
}: SendPasswordResetEmailOptions) {
  const resend = getResendClient();
  const { supportEmail } = await getSupportContactInfo();

  if (!resend) {
    console.info(`[Auth] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: getFromEmail(),
    to,
    subject: "Reset your Smartest Store KE password",
    html: renderPasswordResetEmail({
      name: name?.trim() || "there",
      resetUrl,
      supportEmail,
      expiresInMinutes,
    }),
    replyTo: supportEmail,
  });
}
