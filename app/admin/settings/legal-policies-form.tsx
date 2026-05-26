"use client";

import { useState, useTransition } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { LoadingButton } from "@/components/ui/loading-button";
import { updateAdminSiteSettingsAction } from "@/app/admin/settings/actions";
import { useToast } from "@/lib/use-toast";
import type { SiteSettings } from "@/types";

type LegalTab = "terms" | "privacy";

export function LegalPoliciesForm({ initialSettings }: { initialSettings: SiteSettings | null }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<LegalTab>("terms");
  const [isPending, startTransition] = useTransition();
  const [termsContent, setTermsContent] = useState(initialSettings?.termsContent ?? "<p></p>");
  const [privacyContent, setPrivacyContent] = useState(
    initialSettings?.privacyContent ?? "<p></p>"
  );

  const handleSave = () => {
    startTransition(() => {
      void (async () => {
        try {
          const result = await updateAdminSiteSettingsAction({ termsContent, privacyContent });
          if (!result.success) {
            throw new Error(result.error || "Unable to save legal content.");
          }

          toast({
            title: "Saved successfully",
            description: "Your policies are now live on the storefront.",
          });
        } catch (error) {
          toast({
            title: "Save failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <div className="space-y-6 rounded-[1.75rem] border border-zinc-800 bg-zinc-950/80 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white">Legal / Policies</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Edit the Terms of Service and Privacy Policy content shown on the public site.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          { key: "terms" as const, label: "Terms of Service" },
          { key: "privacy" as const, label: "Privacy Policy" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-brand-500 text-white"
                : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="mb-4 flex items-center gap-3">
          <FileText className="h-4 w-4 text-brand-300" />
          <p className="text-sm font-semibold text-zinc-200">
            {activeTab === "terms" ? "Terms of Service" : "Privacy Policy"}
          </p>
        </div>

        {activeTab === "terms" ? (
          <RichTextEditor value={termsContent} onChange={setTermsContent} />
        ) : (
          <RichTextEditor value={privacyContent} onChange={setPrivacyContent} />
        )}
      </div>

      <div className="flex justify-end">
        <LoadingButton
          type="button"
          isLoading={isPending}
          loadingText="Saving..."
          onClick={handleSave}
          className="rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Save policies
        </LoadingButton>
      </div>
    </div>
  );
}
