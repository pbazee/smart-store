import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth-utils";
import { replyToContactMessage } from "@/lib/contact-message-service";

const replySchema = z.object({
  replyMessage: z.string().trim().min(5, "Reply message is too short."),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await requireAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const payload = replySchema.parse(body);

    const message = await replyToContactMessage({
      id,
      replyMessage: payload.replyMessage,
    });

    revalidatePath("/admin/messages");

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || "Reply failed." },
        { status: 400 }
      );
    }

    console.error("Contact message reply failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send reply. Please try again.",
      },
      { status: 500 }
    );
  }
}
