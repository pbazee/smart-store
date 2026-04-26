import { redirect } from "next/navigation";
import { MessagesManager } from "@/app/admin/messages/messages-manager";
import { requireAdminAuth } from "@/lib/auth-utils";
import { getAdminContactMessages } from "@/lib/contact-message-service";

// Removed force-dynamic to allow Next.js to optimize layout segments.
// The segment remains dynamic due to session checks, but this allows for better
// client-side caching of the layout structure.

export default async function AdminMessagesPage() {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    redirect("/sign-in?redirect_url=%2Fadmin%2Fmessages");
  }

  let messages: Awaited<ReturnType<typeof getAdminContactMessages>> = [];
  try {
    messages = await getAdminContactMessages();
  } catch (error) {
    console.error("[AdminMessagesPage] Failed to load messages:", error);
  }

  return <MessagesManager initialMessages={messages} />;
}
