import { getSiteSettings } from "@/lib/site-settings";
import { sanitizeRichHtml } from "@/lib/rich-text";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const content = sanitizeRichHtml(settings.termsContent);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div
        className="rich-content max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
