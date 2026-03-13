import { redirect } from "next/navigation";
import { BlogsManager } from "@/app/admin/blogs/blogs-manager";
import { fetchAdminBlogs } from "@/app/admin/blogs/actions";
import { requireAdminAuth } from "@/lib/auth-utils";

export default async function AdminBlogsPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fblogs");
  }

  const posts = await fetchAdminBlogs();

  return <BlogsManager initialPosts={posts} />;
}
