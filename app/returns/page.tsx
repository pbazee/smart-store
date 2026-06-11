import { getSiteSettings } from "@/lib/site-settings";
import { getSupportContactInfo } from "@/lib/support-contact";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const { supportPhone, supportTel } = await getSupportContactInfo();
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {settings.returnsContent ? (
        <div
          className="prose prose-lg prose-zinc mx-auto dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: settings.returnsContent }}
        />
      ) : (
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4">Returns & Exchanges</h1>
          <p className="text-xl text-muted-foreground">
            Our return policy is currently being updated. Please contact support.
          </p>
        </div>
      )}

      <div className="mt-16 text-center">
        <div className="bg-muted/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Questions About Returns?</h2>
          <p className="text-muted-foreground mb-6">
            Our customer service team is here to help with any return or exchange questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Contact Us
            </a>
            <a
              href={`tel:${supportTel}`}
              className="inline-block border border-border hover:bg-muted text-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Call {supportPhone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
