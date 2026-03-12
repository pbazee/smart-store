"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteAdminSocialLinkAction } from "@/app/admin/social-links/actions";
import { SocialPlatformIcon } from "@/components/layout/social-platform-icon";
import { SocialLinkFormDialog } from "@/app/admin/social-links/social-link-form-dialog";
import { useToast } from "@/lib/use-toast";
import type { SocialLink } from "@/types";

export function SocialLinksManager({
  initialSocialLinks,
}: {
  initialSocialLinks: SocialLink[];
}) {
  const { toast } = useToast();
  const [socialLinks, setSocialLinks] = useState(initialSocialLinks);
  const [editingSocialLink, setEditingSocialLink] = useState<SocialLink | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSavedSocialLink = (socialLink: SocialLink) => {
    setSocialLinks((current) => {
      const exists = current.some((item) => item.id === socialLink.id);
      if (exists) {
        return current.map((item) => (item.id === socialLink.id ? socialLink : item));
      }

      return [...current, socialLink];
    });
  };

  const handleDelete = async (socialLink: SocialLink) => {
    const confirmed = window.confirm(`Delete ${socialLink.platform} social link?`);
    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deleteAdminSocialLinkAction(socialLink.id);
          setSocialLinks((current) => current.filter((item) => item.id !== socialLink.id));
          toast({
            title: "Social link deleted",
            description: "The footer icon was removed successfully.",
          });
        } catch (error) {
          toast({
            title: "Delete failed",
            description: error instanceof Error ? error.message : "Please try again.",
            variant: "destructive",
          });
        }
      })();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Presence control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Social Links</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Keep footer social icons current across every storefront page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingSocialLink(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add Social Link
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/70">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Platform
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  URL
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {socialLinks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-zinc-400">
                    No social links yet.
                  </td>
                </tr>
              ) : (
                socialLinks.map((socialLink) => (
                  <tr
                    key={socialLink.id}
                    className="border-b border-zinc-800/70 transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300">
                          <SocialPlatformIcon
                            platform={socialLink.platform}
                            className="h-4 w-4"
                          />
                        </span>
                        <span className="text-sm font-semibold capitalize text-zinc-100">
                          {socialLink.platform}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">
                      <a
                        href={socialLink.url}
                        target="_blank"
                        rel="noreferrer"
                        className="transition-colors hover:text-white"
                      >
                        {socialLink.url}
                      </a>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSocialLink(socialLink);
                            setDialogOpen(true);
                          }}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-brand-400 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void handleDelete(socialLink)}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SocialLinkFormDialog
        open={dialogOpen}
        socialLink={editingSocialLink}
        onOpenChange={setDialogOpen}
        onSaved={handleSavedSocialLink}
      />
    </div>
  );
}
