const DEFAULT_HOMEPAGE_CATEGORY_BUCKET =
  process.env.SUPABASE_HOMEPAGE_CATEGORY_BUCKET || "homepage-categories";
const DEFAULT_HERO_SLIDE_BUCKET =
  process.env.SUPABASE_HERO_SLIDE_BUCKET || "hero-slides";
const DEFAULT_BLOG_IMAGE_BUCKET =
  process.env.SUPABASE_BLOG_IMAGE_BUCKET || "blog-images";
const DEFAULT_POPUP_IMAGE_BUCKET =
  process.env.SUPABASE_POPUP_IMAGE_BUCKET || "popup-images";
const DEFAULT_STORE_ASSETS_BUCKET =
  process.env.SUPABASE_STORE_ASSETS_BUCKET || "store-assets";
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
}

function getSupabaseStorageKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

function createInlineImageDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function sanitizeFileName(fileName: string, fallbackName: string) {
  return (
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallbackName
  );
}

function getPublicObjectUrl(bucket: string, objectPath: string) {
  const supabaseUrl = getSupabaseUrl();
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
}

export function getHomepageCategoryBucketName() {
  return DEFAULT_HOMEPAGE_CATEGORY_BUCKET;
}

export function getHeroSlideBucketName() {
  return DEFAULT_HERO_SLIDE_BUCKET;
}

export function getBlogImageBucketName() {
  return DEFAULT_BLOG_IMAGE_BUCKET;
}

export function getPopupImageBucketName() {
  return DEFAULT_POPUP_IMAGE_BUCKET;
}

export function getStoreAssetsBucketName() {
  return DEFAULT_STORE_ASSETS_BUCKET;
}

async function uploadImageToBucket(input: {
  file: File;
  bucket: string;
  fallbackName: string;
  contextLabel: string;
  folder?: string;
}) {
  const { file, bucket, fallbackName, contextLabel, folder } = input;

  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    throw new Error("Please upload an image smaller than 5MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";
  const supabaseUrl = getSupabaseUrl();
  const storageKey = getSupabaseStorageKey();

  if (!supabaseUrl || !storageKey) {
    return createInlineImageDataUrl(buffer, mimeType);
  }

  const fileName = `${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name, fallbackName)}`;
  const objectPath = folder ? `${folder.replace(/^\/+|\/+$/g, "")}/${fileName}` : fileName;

  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: storageKey,
        Authorization: `Bearer ${storageKey}`,
        "Content-Type": mimeType,
        "x-upsert": "false",
      },
      body: buffer,
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || "Supabase storage upload failed.");
    }

    return getPublicObjectUrl(bucket, objectPath);
  } catch (error) {
    console.error(`Supabase ${contextLabel} upload failed, using inline fallback:`, error);
    return createInlineImageDataUrl(buffer, mimeType);
  }
}

function extractObjectPath(imageUrl: string, bucket: string) {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl || !imageUrl || imageUrl.startsWith("data:")) {
    return null;
  }

  try {
    const publicUrl = new URL(imageUrl);
    const baseUrl = new URL(supabaseUrl);

    if (publicUrl.hostname !== baseUrl.hostname) {
      return null;
    }

    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (!publicUrl.pathname.startsWith(prefix)) {
      return null;
    }

    return decodeURIComponent(publicUrl.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

async function deleteImageFromBucket(input: {
  imageUrl?: string | null;
  bucket: string;
  contextLabel: string;
}) {
  const { imageUrl, bucket, contextLabel } = input;
  const objectPath = imageUrl ? extractObjectPath(imageUrl, bucket) : null;
  const supabaseUrl = getSupabaseUrl();
  const storageKey = getSupabaseStorageKey();

  if (!objectPath || !supabaseUrl || !storageKey) {
    return;
  }

  try {
    await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
      method: "DELETE",
      headers: {
        apikey: storageKey,
        Authorization: `Bearer ${storageKey}`,
      },
      cache: "no-store",
    });
  } catch (error) {
    console.error(`${contextLabel} image cleanup failed:`, error);
  }
}

export async function uploadHomepageCategoryImage(file: File) {
  return uploadImageToBucket({
    file,
    bucket: DEFAULT_HOMEPAGE_CATEGORY_BUCKET,
    fallbackName: "homepage-category",
    contextLabel: "homepage category",
  });
}

export async function uploadHeroSlideImage(file: File) {
  return uploadImageToBucket({
    file,
    bucket: DEFAULT_HERO_SLIDE_BUCKET,
    fallbackName: "hero-slide",
    contextLabel: "hero slide",
  });
}

export async function deleteHomepageCategoryImage(imageUrl?: string | null) {
  return deleteImageFromBucket({
    imageUrl,
    bucket: DEFAULT_HOMEPAGE_CATEGORY_BUCKET,
    contextLabel: "Homepage category",
  });
}

export async function deleteHeroSlideImage(imageUrl?: string | null) {
  return deleteImageFromBucket({
    imageUrl,
    bucket: DEFAULT_HERO_SLIDE_BUCKET,
    contextLabel: "Hero slide",
  });
}

export async function uploadBlogImage(file: File) {
  return uploadImageToBucket({
    file,
    bucket: DEFAULT_BLOG_IMAGE_BUCKET,
    fallbackName: "blog-image",
    contextLabel: "blog image",
  });
}

export async function deleteBlogImage(imageUrl?: string | null) {
  return deleteImageFromBucket({
    imageUrl,
    bucket: DEFAULT_BLOG_IMAGE_BUCKET,
    contextLabel: "Blog",
  });
}

export async function uploadPopupImage(file: File) {
  return uploadImageToBucket({
    file,
    bucket: DEFAULT_POPUP_IMAGE_BUCKET,
    fallbackName: "popup-image",
    contextLabel: "popup image",
  });
}

export async function deletePopupImage(imageUrl?: string | null) {
  return deleteImageFromBucket({
    imageUrl,
    bucket: DEFAULT_POPUP_IMAGE_BUCKET,
    contextLabel: "Popup",
  });
}

export async function uploadStoreAsset(file: File, fallbackName: string, folder?: string) {
  return uploadImageToBucket({
    file,
    bucket: DEFAULT_STORE_ASSETS_BUCKET,
    fallbackName,
    contextLabel: "store asset",
    folder,
  });
}

export async function deleteStoreAsset(imageUrl?: string | null) {
  return deleteImageFromBucket({
    imageUrl,
    bucket: DEFAULT_STORE_ASSETS_BUCKET,
    contextLabel: "Store asset",
  });
}
