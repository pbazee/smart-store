-- Add hierarchy-supporting columns to Category without changing UUID primary key.
-- Safe to run multiple times thanks to IF NOT EXISTS.

ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- Optional: index for faster tree queries
CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON "Category" ("parentId");
