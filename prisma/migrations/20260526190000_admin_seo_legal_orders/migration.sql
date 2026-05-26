ALTER TABLE "Blog"
  ADD COLUMN IF NOT EXISTS "metaTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "metaDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "ogImage" TEXT,
  ADD COLUMN IF NOT EXISTS "focusKeyword" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SiteSettings') THEN
    -- no-op placeholder
    NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "SiteSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "termsContent" TEXT NOT NULL,
  "privacyContent" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'out_for_delivery';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'returned';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "PayStatus" ADD VALUE IF NOT EXISTS 'unpaid';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "PayStatus" ADD VALUE IF NOT EXISTS 'partially_paid';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "SiteSettings" ("id", "termsContent", "privacyContent")
VALUES ('default', '<p>Terms of Service</p>', '<p>Privacy Policy</p>')
ON CONFLICT ("id") DO NOTHING;
