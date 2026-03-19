import { NextRequest, NextResponse } from "next/server";
import { updateReviewAdmin, deleteReviewAdmin } from "@/lib/reviews-service";
import { getSessionUser } from "@/lib/session-user";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionUser = await getSessionUser();
        if (sessionUser?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const updated = await updateReviewAdmin(id, body);

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionUser = await getSessionUser();
        if (sessionUser?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await deleteReviewAdmin(id);

        return NextResponse.json({ success: true, message: "Review deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }
}
