"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Loader2, NotebookText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { BlogFormDialog } from "@/app/admin/blogs/blog-form-dialog";
import { deleteAdminBlogAction } from "@/app/admin/blogs/actions";
import { useToast } from "@/lib/use-toast";
import type { BlogPost } from "@/types";

export function BlogsManager({
  initialPosts,
}: {
  initialPosts: BlogPost[];
}) {
  const { toast } = useToast();
  const [posts, setPosts] = useState(initialPosts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const visiblePosts = useMemo(() => {
    return [...posts]
      .filter((post) => {
        const matchesSearch =
          !deferredSearch.trim() ||
          [post.title, post.slug, post.content]
            .join(" ")
            .toLowerCase()
            .includes(deferredSearch.trim().toLowerCase());

        const matchesFilter =
          filter === "all" ||
          (filter === "published" ? post.isPublished : !post.isPublished);

        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => {
        const leftTime = new Date(left.publishedAt || left.createdAt).getTime();
        const rightTime = new Date(right.publishedAt || right.createdAt).getTime();
        return rightTime - leftTime;
      });
  }, [posts, deferredSearch, filter]);

  const handleSavedPost = (post: BlogPost) => {
    setPosts((current) => {
      const exists = current.some((item) => item.id === post.id);
      if (exists) {
        return current.map((item) => (item.id === post.id ? post : item));
      }

      return [post, ...current];
    });
  };

  const handleDelete = async (post: BlogPost) => {
    const confirmed = window.confirm(`Delete "${post.title}" from the blog?`);

    if (!confirmed) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await deleteAdminBlogAction(post.id);
          setPosts((current) => current.filter((item) => item.id !== post.id));
          toast({
            title: "Blog post deleted",
            description: "The post was removed successfully.",
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

  const publishedCount = posts.filter((post) => post.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-400">
            Content control
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Admin Blogs</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage editorial posts, homepage teasers, and the public blog from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPost(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          Create New Post
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Total posts</p>
          <p className="mt-2 text-3xl font-black text-white">{posts.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Published</p>
          <p className="mt-2 text-3xl font-black text-white">{publishedCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">Visible results</p>
          <p className="mt-2 text-3xl font-black text-white">{visiblePosts.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, slug, or content"
            className="h-12 w-full rounded-full border border-zinc-800 bg-zinc-900 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "published", "draft"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                filter === value
                  ? "bg-brand-500 text-white"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {value[0].toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-zinc-800 bg-zinc-950/70">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Title
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Slug
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Published?
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visiblePosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-zinc-400">
                    No blog posts match the current filters.
                  </td>
                </tr>
              ) : (
                visiblePosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-zinc-800/70 transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-4 align-middle">
                      <div className="max-w-lg">
                        <p className="font-semibold text-zinc-100">{post.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {post.content.replace(/^##\s+/gm, "").replace(/\s+/g, " ").trim().slice(0, 90)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">{post.slug}</td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          post.isPublished
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {post.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-zinc-300">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Not published"}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPost(post);
                            setDialogOpen(true);
                          }}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-brand-400 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => void handleDelete(post)}
                          className="rounded-xl border border-zinc-800 p-2 text-zinc-300 transition-colors hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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

      <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-brand-500/15 p-3 text-brand-300">
            <NotebookText className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-sm text-zinc-400">
            <p className="font-semibold text-zinc-100">Storefront behavior</p>
            <p>
              Published posts flow to the public blog and the landing-page teaser automatically, while
              drafts stay inside admin until you publish them.
            </p>
          </div>
        </div>
      </div>

      <BlogFormDialog
        open={dialogOpen}
        post={editingPost}
        onOpenChange={setDialogOpen}
        onSaved={handleSavedPost}
      />
    </div>
  );
}
