import { Resend } from "resend";
import { formatKES } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { resolveSupportContactInfo } from "@/lib/support-contact";
import type { StoreSettings } from "@/types";

type OrderEmailItem = {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  variantLabel?: string | null;
};

type OrderEmailDetails = {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    paymentMethod: string;
    total: number;
    shippingAmount: number;
    shippingRuleName?: string | null;
    address: string;
    city: string;
    county?: string | null;
    createdAt: Date;
  };
  items: OrderEmailItem[];
  storeSettings: StoreSettings | null;
};

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
let hasWarnedAboutResend = false;

function getBaseUrl(origin?: string) {
  return (process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000").replace(/\/$/, "");
}

function formatVariantLabel(variant?: { size?: string | null; color?: string | null }) {
  if (!variant) return null;
  const parts = [variant.size, variant.color].filter(Boolean);
  return parts.length ? parts.join(" / ") : null;
}

async function buildOrderEmailDetails(orderId: string): Promise<OrderEmailDetails | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return null;
  }

  const variantIds = order.items.map((item) => item.variantId).filter(Boolean) as string[];
  const variants = variantIds.length
    ? await prisma.variant.findMany({ where: { id: { in: variantIds } } })
    : [];
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  const items: OrderEmailItem[] = order.items.map((item) => ({
    id: item.id,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    variantLabel: formatVariantLabel(
      item.variantId ? variantMap.get(item.variantId) : undefined
    ),
  }));

  const storeSettings = await getStoreSettings({ seedIfEmpty: true, fallbackOnError: true });

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      paymentMethod: order.paymentMethod,
      total: order.total,
      shippingAmount: order.shippingAmount,
      shippingRuleName: order.shippingRuleName,
      address: order.address,
      city: order.city,
      county: (order as any).county ?? null,
      createdAt: order.createdAt,
    },
    items,
    storeSettings,
  };
}

function renderItemsTable(items: OrderEmailItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#0f172a;">${item.productName}</div>
            ${
              item.variantLabel
                ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${item.variantLabel}</div>`
                : ""
            }
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;color:#0f172a;">${
            item.quantity
          }</td>
          <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#0ea5e9;">${formatKES(
            item.price * item.quantity
          )}</td>
        </tr>
      `
    )
    .join("");
}

function renderCustomerEmail(details: OrderEmailDetails, baseUrl: string) {
  const { supportEmail, supportPhone, supportTel } =
    resolveSupportContactInfo(details.storeSettings);

  return `
  <html>
    <head>
      <style>
        @media (max-width: 640px) {
          .container { width: 100% !important; padding: 16px !important; }
          .cta { display: block !important; width: 100% !important; text-align: center !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:#0b1221;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0b1221;padding:24px 0;">
        <tr>
          <td align="center">
            <table class="container" width="640" cellpadding="0" cellspacing="0" role="presentation" style="width:640px;max-width:640px;background:#0f172a;border-radius:20px;overflow:hidden;color:#e2e8f0;padding:24px;border:1px solid #1e293b;">
              <tr>
                <td style="text-align:left;">
                  <div style="display:flex;align-items:center;gap:12px;">
                    ${
                      details.storeSettings?.logoDarkUrl || details.storeSettings?.logoUrl
                        ? `<img src="${details.storeSettings.logoDarkUrl || details.storeSettings.logoUrl}" alt="${details.storeSettings.storeName || "Smartest Store KE"}" style="height:36px;max-width:140px;object-fit:contain;display:block;" />`
                        : `<div style="width:36px;height:36px;border-radius:8px;background:#fb923c;display:flex;align-items:center;justify-content:center;color:#0f172a;font-weight:800;font-size:14px;">SK</div>`
                    }
                    <div style="font-weight:800;font-size:18px;color:#fff;">${
                      details.storeSettings?.storeName || "Smartest Store KE"
                    }</div>
                  </div>
                </td>
                <td style="text-align:right;color:#38bdf8;font-weight:700;">Order Confirmed 🎉</td>
              </tr>
              <tr><td colspan="2" style="height:16px;"></td></tr>
              <tr>
                <td colspan="2" style="background:#0b1221;border:1px solid #1e293b;border-radius:16px;padding:20px;">
                  <p style="margin:0;color:#e2e8f0;font-size:16px;font-weight:700;">Hi ${details.order.customerName}, thanks for shopping at Smartest Store KE!</p>
                  <p style="margin:12px 0 0;color:#cbd5e1;font-size:14px;">We’ve locked in your order and our Nairobi team is prepping it now.</p>
                </td>
              </tr>
              <tr><td colspan="2" style="height:18px;"></td></tr>
              <tr>
                <td colspan="2" style="background:#0b1221;border:1px solid #1e293b;border-radius:16px;padding:20px;">
                  <table width="100%" role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;color:#94a3b8;font-size:12px;">Order ID</td>
                      <td style="padding:8px 0;text-align:right;font-weight:700;color:#e2e8f0;">${details.order.orderNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#94a3b8;font-size:12px;">Date</td>
                      <td style="padding:8px 0;text-align:right;color:#e2e8f0;">${details.order.createdAt.toLocaleString(
                        "en-KE"
                      )}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#94a3b8;font-size:12px;">Total</td>
                      <td style="padding:8px 0;text-align:right;font-weight:800;color:#f97316;">${formatKES(
                        details.order.total
                      )}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#94a3b8;font-size:12px;">Shipping</td>
                      <td style="padding:8px 0;text-align:right;color:#e2e8f0;">
                        ${details.order.shippingAmount === 0 ? "Free" : formatKES(details.order.shippingAmount)}
                        ${details.order.shippingRuleName ? ` · ${details.order.shippingRuleName}` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#94a3b8;font-size:12px;">Payment</td>
                      <td style="padding:8px 0;text-align:right;color:#e2e8f0;">${
                        details.order.paymentMethod?.toLowerCase() === "mpesa"
                          ? "M-Pesa"
                          : "Card"
                      }</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#94a3b8;font-size:12px;">Delivery</td>
                      <td style="padding:8px 0;text-align:right;color:#e2e8f0;">Same-day in Nairobi</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#94a3b8;font-size:12px;">Ship to</td>
                      <td style="padding:8px 0;text-align:right;color:#e2e8f0;">${details.order.address}, ${details.order.city}${details.order.county ? `, ${details.order.county}` : ""}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td colspan="2" style="height:18px;"></td></tr>
              <tr>
                <td colspan="2" style="background:#0b1221;border:1px solid #1e293b;border-radius:16px;padding:0;">
                  <table width="100%" role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <thead>
                      <tr style="background:#0f172a;color:#cbd5e1;text-transform:uppercase;font-size:12px;letter-spacing:0.08em;">
                        <th style="text-align:left;padding:12px 8px;">Item</th>
                        <th style="text-align:center;padding:12px 8px;width:70px;">Qty</th>
                        <th style="text-align:right;padding:12px 8px;width:120px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${renderItemsTable(details.items)}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr><td colspan="2" style="height:18px;"></td></tr>
              <tr>
                <td colspan="2" style="text-align:center;">
                  <a
                    href="${baseUrl}/orders/${details.order.id}"
                    class="cta"
                    style="background:#f97316;color:#0f172a;font-weight:800;padding:14px 22px;border-radius:999px;text-decoration:none;display:inline-block;box-shadow:0 12px 30px rgba(249,115,22,0.25);"
                  >
                    Track your order
                  </a>
                </td>
              </tr>
              <tr><td colspan="2" style="height:18px;"></td></tr>
              <tr>
                <td colspan="2" style="background:#0b1221;border:1px solid #1e293b;border-radius:16px;padding:16px;">
                  <table width="100%" role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#22c55e;font-weight:700;">✅ M-Pesa Secure</td>
                      <td style="color:#38bdf8;font-weight:700;text-align:right;">🚚 Nairobi delivery</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td colspan="2" style="height:12px;"></td></tr>
              <tr>
                <td colspan="2" style="text-align:center;color:#94a3b8;font-size:12px;">
                  Need help? <a href="mailto:${supportEmail}" style="color:#f97316;text-decoration:none;">${supportEmail}</a> ·
                  <a href="tel:${supportTel}" style="color:#f97316;text-decoration:none;">${supportPhone}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

function renderAdminEmail(details: OrderEmailDetails, baseUrl: string) {
  return `
  <html>
    <body style="margin:0;padding:0;background:#0b1221;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:18px 0;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="width:520px;max-width:520px;background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:18px;">
              <tr>
                <td style="font-weight:800;font-size:16px;color:#fff;">New Order Received</td>
                <td style="text-align:right;color:#f97316;font-weight:700;">${details.order.orderNumber}</td>
              </tr>
              <tr><td colspan="2" style="height:12px;"></td></tr>
              <tr>
                <td colspan="2" style="background:#0b1221;border:1px solid #1e293b;border-radius:14px;padding:14px;">
                  <table width="100%" role="presentation">
                    <tr>
                      <td style="color:#94a3b8;font-size:12px;">Customer</td>
                      <td style="text-align:right;color:#e2e8f0;font-weight:700;">${details.order.customerName} · ${details.order.customerEmail}</td>
                    </tr>
                    <tr>
                      <td style="color:#94a3b8;font-size:12px;">Items</td>
                      <td style="text-align:right;color:#e2e8f0;">${details.items.length} items</td>
                    </tr>
                    <tr>
                      <td style="color:#94a3b8;font-size:12px;">Total</td>
                      <td style="text-align:right;color:#f97316;font-weight:800;">${formatKES(details.order.total)}</td>
                    </tr>
                    <tr>
                      <td style="color:#94a3b8;font-size:12px;">Shipping</td>
                      <td style="text-align:right;color:#e2e8f0;">
                        ${details.order.shippingAmount === 0 ? "Free" : formatKES(details.order.shippingAmount)}
                        ${details.order.shippingRuleName ? ` · ${details.order.shippingRuleName}` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td style="color:#94a3b8;font-size:12px;">Payment</td>
                      <td style="text-align:right;color:#e2e8f0;">${
                        details.order.paymentMethod?.toLowerCase() === "mpesa"
                          ? "M-Pesa"
                          : "Card"
                      }</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td colspan="2" style="height:14px;"></td></tr>
              <tr>
                <td colspan="2" style="text-align:center;">
                  <a
                    href="${baseUrl}/admin/orders/${details.order.orderNumber}"
                    style="background:#38bdf8;color:#0f172a;font-weight:800;padding:12px 18px;border-radius:999px;text-decoration:none;display:inline-block;"
                  >
                    View in Admin
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resendClient) {
    if (!hasWarnedAboutResend) {
      console.warn("RESEND_API_KEY is missing; skipping email notifications.");
      hasWarnedAboutResend = true;
    }
    return;
  }

  await resendClient.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Smartest Store KE <onboarding@resend.dev>",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendOrderEmailsAfterPayment(options: { orderId: string; origin?: string }) {
  try {
    const details = await buildOrderEmailDetails(options.orderId);
    if (!details) return;

    const baseUrl = getBaseUrl(options.origin);

    // Customer confirmation
    if (details.order.customerEmail) {
      try {
        await sendEmail({
          to: details.order.customerEmail,
          subject: `Your Order is Confirmed! 🎉 #${details.order.orderNumber}`,
          html: renderCustomerEmail(details, baseUrl),
        });
      } catch (error) {
        console.error("Failed to send customer order email:", error);
      }
    }

    // Admin alert
    const { adminNotificationEmail } = resolveSupportContactInfo(details.storeSettings);

    if (adminNotificationEmail) {
      try {
        await sendEmail({
          to: adminNotificationEmail,
          subject: `New Order Received! #${details.order.orderNumber} - ${formatKES(details.order.total)}`,
          html: renderAdminEmail(details, baseUrl),
        });
      } catch (error) {
        console.error("Failed to send admin order email:", error);
      }
    }
  } catch (error) {
    console.error("Order email pipeline failed:", error);
  }
}
