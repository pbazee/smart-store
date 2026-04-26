import { getSupportContactInfo } from "@/lib/support-contact";

export const dynamic = "force-static";

export default async function PrivacyPolicyPage() {
  const { supportEmail, supportPhone } = await getSupportContactInfo();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4">Privacy Policy</h1>
        <p className="text-xl text-muted-foreground">
          How we protect and use your personal information
        </p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-8">
          <strong>Last updated:</strong> March 9, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly to us, such as when you create an account, make a purchase,
            or contact us for support. This includes:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Name, email address, and phone number</li>
            <li>Billing and shipping addresses</li>
            <li>Payment information (processed securely by our payment partners)</li>
            <li>Order history and preferences</li>
            <li>Communications with our customer service team</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Process and fulfill your orders</li>
            <li>Provide customer service and support</li>
            <li>Send you important updates about your orders</li>
            <li>Improve our products and services</li>
            <li>Send marketing communications (with your consent)</li>
            <li>Prevent fraud and maintain security</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>With service providers who help us operate our business (payment processors, shipping companies)</li>
            <li>When required by law or to protect our rights</li>
            <li>With your explicit consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Data Security</h2>
          <p className="mb-4">
            We implement appropriate security measures to protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. This includes:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>SSL encryption for all data transmission</li>
            <li>Secure payment processing through certified partners</li>
            <li>Regular security audits and updates</li>
            <li>Limited access to personal information on a need-to-know basis</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict processing of your information</li>
            <li>Data portability (receive your data in a structured format)</li>
            <li>Withdraw consent for marketing communications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar technologies to enhance your browsing experience, analyze site traffic,
            and personalize content. You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
          <p className="mb-4">
            Our services are not intended for children under 13. We do not knowingly collect personal information
            from children under 13. If we become aware that we have collected such information, we will delete it immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">International Data Transfers</h2>
          <p className="mb-4">
            Your information may be transferred to and processed in countries other than Kenya. We ensure that
            such transfers comply with applicable data protection laws and implement appropriate safeguards.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any material changes
            by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="bg-muted/50 rounded-lg p-4">
            <p><strong>Email:</strong> {supportEmail}</p>
            <p><strong>Phone:</strong> {supportPhone}</p>
            <p><strong>Address:</strong> Westlands Shopping Centre, Nairobi, Kenya</p>
          </div>
        </section>
      </div>
    </div>
  );
}
