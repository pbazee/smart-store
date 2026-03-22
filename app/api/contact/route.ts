import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createContactMessage } from "@/lib/contact-message-service";

const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Your name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  subject: z.string().trim().min(2, "Select or enter a subject."),
  message: z.string().trim().min(5, "Please add a short message."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = contactMessageSchema.parse(body);

    const message = await createContactMessage(payload);

    revalidatePath("/contact");
    revalidatePath("/admin/messages");

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        status: message.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors[0]?.message || "Please review the form and try again.",
        },
        { status: 400 }
      );
    }

    console.error("Contact form submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send message. Please try again.",
      },
      { status: 500 }
    );
  }
}
