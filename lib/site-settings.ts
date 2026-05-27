import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizeRichTextHtml } from "@/lib/rich-text";
import type { SiteSettings } from "@/types";

export const DEFAULT_PRIVACY_CONTENT = `
<h1>Privacy Policy</h1>
<p>Last updated: March 9, 2026</p>
<h2>Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>
<ul>
  <li>Name, email address, and phone number</li>
  <li>Billing and shipping addresses</li>
  <li>Payment information processed securely by our payment partners</li>
  <li>Order history and preferences</li>
  <li>Communications with our customer service team</li>
</ul>
<h2>How We Use Your Information</h2>
<ul>
  <li>Process and fulfill your orders</li>
  <li>Provide customer service and support</li>
  <li>Send updates about your orders</li>
  <li>Improve our products and services</li>
  <li>Send marketing communications with your consent</li>
  <li>Prevent fraud and maintain security</li>
</ul>
<h2>Information Sharing</h2>
<p>We do not sell, trade, or rent your personal information to third parties. We only share it with service providers, when required by law, or with your consent.</p>
<h2>Data Security</h2>
<ul>
  <li>SSL encryption for data transmission</li>
  <li>Secure payment processing</li>
  <li>Regular security updates</li>
  <li>Need-to-know access controls</li>
</ul>
<h2>Your Rights</h2>
<ul>
  <li>Access the personal information we hold about you</li>
  <li>Correct inaccurate or incomplete information</li>
  <li>Request deletion of your personal information</li>
  <li>Object to or restrict processing</li>
  <li>Request a portable copy of your data</li>
  <li>Withdraw consent for marketing communications</li>
</ul>
<h2>Cookies and Tracking</h2>
<p>We use cookies and similar technologies to improve browsing, analyze traffic, and personalize content.</p>
<h2>Children's Privacy</h2>
<p>Our services are not intended for children under 13, and we do not knowingly collect their personal information.</p>
<h2>International Data Transfers</h2>
<p>Your information may be processed outside Kenya where needed, subject to appropriate safeguards.</p>
<h2>Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time by posting the new version on this page.</p>
<h2>Contact Us</h2>
<p>If you have questions about this Privacy Policy, please contact our support team.</p>
`;

export const DEFAULT_TERMS_CONTENT = `
<h1>Terms of Service</h1>
<p>Last updated: March 9, 2026</p>
<h2>Overview</h2>
<p>These Terms of Service govern your use of Smartest Store KE, including browsing, purchasing, and interacting with our services.</p>
<h2>Orders and Payments</h2>
<p>By placing an order, you confirm that the information you provide is accurate and complete. Orders are subject to acceptance and product availability.</p>
<ul>
  <li>Prices are listed in Kenyan shillings unless stated otherwise.</li>
  <li>Payments are processed securely through our approved payment providers.</li>
  <li>We may cancel or refuse orders affected by pricing errors, fraud concerns, or stock issues.</li>
</ul>
<h2>Shipping and Delivery</h2>
<p>Delivery timelines are estimates and may vary by location, courier conditions, and product availability.</p>
<h2>Returns and Exchanges</h2>
<p>Please review our returns policy for the latest eligibility and process details before requesting a return or exchange.</p>
<h2>Product Information</h2>
<p>We work to display product details, colors, and images as accurately as possible, but actual presentation may vary by device and lighting.</p>
<h2>Acceptable Use</h2>
<ul>
  <li>Do not misuse the website, payment systems, or account features.</li>
  <li>Do not attempt to interfere with the platform's security or availability.</li>
  <li>Do not use our content or branding without permission.</li>
</ul>
<h2>Liability</h2>
<p>To the fullest extent allowed by law, Smartest Store KE is not liable for indirect, incidental, or consequential damages arising from your use of the service.</p>
<h2>Changes</h2>
<p>We may update these terms from time to time. Continued use of the site after updates means you accept the revised terms.</p>
<h2>Contact</h2>
<p>If you have questions about these terms, contact our support team.</p>
`;

export async function getSiteSettings() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (settings) {
    return settings as SiteSettings;
  }

  return {
    id: "default",
    termsContent: normalizeRichTextHtml(DEFAULT_TERMS_CONTENT),
    privacyContent: normalizeRichTextHtml(DEFAULT_PRIVACY_CONTENT),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SiteSettings;
}

export async function updateSiteSettings(input: {
  termsContent: string;
  privacyContent: string;
}) {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      termsContent: normalizeRichTextHtml(input.termsContent),
      privacyContent: normalizeRichTextHtml(input.privacyContent),
    },
    create: {
      id: "default",
      termsContent: normalizeRichTextHtml(input.termsContent),
      privacyContent: normalizeRichTextHtml(input.privacyContent),
    },
  });

  return settings as SiteSettings;
}
