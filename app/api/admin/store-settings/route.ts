import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-identity";
import { deleteStoreAsset, uploadStoreAsset } from "@/lib/supabase-storage";
import { getStoreSettings, STORE_SETTINGS_CACHE_TAG, upsertStoreSettings } from "@/lib/store-settings";

const assetFieldMap = {
  logoUrl: "logoUrl",
  logoDarkUrl: "logoDarkUrl",
  faviconUrl: "faviconUrl",
} as const;

const deleteSchema = z.object({
  slot: z.enum(["logoUrl", "logoDarkUrl", "faviconUrl"]),
  previousUrl: z.string().trim().optional(),
});

function revalidateStoreSettingsViews() {
  revalidateTag(STORE_SETTINGS_CACHE_TAG);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
}

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getStoreSettings({ seedIfEmpty: true, fallbackOnError: true });
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const slot = formData.get("slot");
    const file = formData.get("file");
    const previousUrl = String(formData.get("previousUrl") || "");

    if (typeof slot !== "string" || !(slot in assetFieldMap) || !(file instanceof File)) {
      return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
    }

    const assetUrl = await uploadStoreAsset(file, String(slot));
    const existing = await getStoreSettings({ seedIfEmpty: true, fallbackOnError: true });
    const updated = await upsertStoreSettings({
      storeName: existing?.storeName,
      storeTagline: existing?.storeTagline,
      logoUrl: slot === "logoUrl" ? assetUrl : existing?.logoUrl,
      logoDarkUrl: slot === "logoDarkUrl" ? assetUrl : existing?.logoDarkUrl,
      faviconUrl: slot === "faviconUrl" ? assetUrl : existing?.faviconUrl,
      supportEmail: existing?.supportEmail,
      supportPhone: existing?.supportPhone,
      adminNotificationEmail: existing?.adminNotificationEmail,
      contactPhone: existing?.contactPhone,
      footerContactPhone: existing?.footerContactPhone,
    });

    if (previousUrl && previousUrl !== assetUrl) {
      await deleteStoreAsset(previousUrl);
    }

    revalidateStoreSettingsViews();
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Store asset upload failed:", error);
    return NextResponse.json({ error: "Failed to upload asset" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const payload = deleteSchema.parse(await request.json());
    const existing = await getStoreSettings({ seedIfEmpty: true, fallbackOnError: true });
    const updated = await upsertStoreSettings({
      storeName: existing?.storeName,
      storeTagline: existing?.storeTagline,
      logoUrl: payload.slot === "logoUrl" ? null : existing?.logoUrl,
      logoDarkUrl: payload.slot === "logoDarkUrl" ? null : existing?.logoDarkUrl,
      faviconUrl: payload.slot === "faviconUrl" ? null : existing?.faviconUrl,
      supportEmail: existing?.supportEmail,
      supportPhone: existing?.supportPhone,
      adminNotificationEmail: existing?.adminNotificationEmail,
      contactPhone: existing?.contactPhone,
      footerContactPhone: existing?.footerContactPhone,
    });

    if (payload.previousUrl) {
      await deleteStoreAsset(payload.previousUrl);
    }

    revalidateStoreSettingsViews();
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Store asset removal failed:", error);
    return NextResponse.json({ error: "Failed to remove asset" }, { status: 500 });
  }
}
