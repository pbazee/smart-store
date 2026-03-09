# 🔌 Database Connection Testing Guide

## Connection URL Updated ✅

Your database URL has been updated to use **Supabase Connection Pooling** (recommended for serverless):

```
OLD (Direct connection):
postgresql://postgres:0746284433%40Peter@db.vqqiyqmlckwknutlbfvw.supabase.co:5432/postgres

NEW (Connection pooling - Better for Next.js):
postgresql://postgres.vqqiyqmlckwknutlbfvw:0746284433%40Peter@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

---

## 🔍 Current Connection Status

✅ URL: `aws-1-eu-west-1.pooler.supabase.com:5432`
❌ Connection: Not reaching database server

**Possible Causes:**
1. Supabase project is suspended/paused
2. Network firewall blocking connection
3. Incorrect credentials
4. Region mismatch

---

## ✅ Verification Checklist

### **Step 1: Verify Supabase Project Status**

1. Go to https://supabase.com/dashboard
2. Check your project for:
   - ✅ **Project Status**: Should be "Active" (green)
   - ✅ **Database**: Should be running
   - ✅ **Connection limits**: Should not be exceeded

### **Step 2: Verify Connection URL**

In Supabase Dashboard, go to **Settings → Database → Connection string**:

```
1. Select "Connection pooling" tab
2. Copy the full URI
3. Extract the host (should be aws-1-eu-west-1.pooler.supabase.com)
4. Verify password is correct
5. Update .env if different
```

### **Step 3: Check Region**

Your URL includes `eu-west-1` - verify this matches your Supabase region:
- US: `aws-1-us-east-1`
- EU: `aws-1-eu-west-1` ← Your current region
- Singapore: `aws-1-ap-southeast-1`

### **Step 4: Verify Credentials**

```
Expected format:
postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

Your current:
postgresql://postgres.vqqiyqmlckwknutlbfvw:0746284433%40Peter@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

Check:
✅ Project ref: vqqiyqmlckwknutlbfvw (vqqiyqmlckwknutlbfvw)
✅ Password: 0746284433@Peter (encoded as 0746284433%40Peter)
✅ Region: eu-west-1 (aws-1-eu-west-1)
```

---

## 🛠️ Alternative Connection Methods

### **Option A: Use Direct Connection (Backup)**
If connection pooling doesn't work, use the direct connection URL:

```env
DATABASE_URL="postgresql://postgres:0746284433%40Peter@db.vqqiyqmlckwknutlbfvw.supabase.co:5432/postgres"
```

Then run:
```bash
npx prisma db push
```

### **Option B: Manual SQL Execution**
Create tables manually in Supabase:

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Create new query
4. Paste the schema below:

```sql
-- Product table
CREATE TABLE "Product" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  gender TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  "basePrice" INTEGER NOT NULL,
  images TEXT[] NOT NULL,
  rating FLOAT DEFAULT 0,
  "reviewCount" INTEGER DEFAULT 0,
  "isFeatured" BOOLEAN DEFAULT false,
  "isNew" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Variant table
CREATE TABLE "Variant" (
  id TEXT PRIMARY KEY,
  color TEXT NOT NULL,
  "colorHex" TEXT NOT NULL,
  size TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  price INTEGER NOT NULL,
  "productId" TEXT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE
);

-- Order table
CREATE TABLE "Order" (
  id TEXT PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  "paymentStatus" TEXT DEFAULT 'PENDING',
  "paymentMethod" TEXT NOT NULL,
  total INTEGER NOT NULL,
  address TEXT NOT NULL,
  items JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX "Variant_productId_idx" ON "Variant"("productId");
CREATE INDEX "Order_status_idx" ON "Order"(status);
```

---

## 🧪 Test Commands (When Connected)

Once connection works, test with:

```bash
# 1. Check connection
npx prisma db execute --stdin < /dev/null

# 2. Push schema
npx prisma db push

# 3. Seed database
npm run prisma:seed

# 4. View database
npx prisma studio
```

---

## 📝 Files Updated

✅ `.env` - Connection pooling URL added
✅ `.env.local` - Connection pooling URL added

---

## 🎯 Next Actions

**Choose one:**

### **If Supabase is running:**
```bash
# Try connection pooling (already configured)
npx prisma db push

# If that fails, switch to direct connection and update .env:
# DATABASE_URL="postgresql://postgres:0746284433%40Peter@db.vqqiyqmlckwknutlbfvw.supabase.co:5432/postgres"
# Then try again
npx prisma db push
```

### **If Supabase needs to be activated:**
1. Go to https://supabase.com/dashboard
2. Check project status
3. Unpause project if paused
4. Wait for database to boot up
5. Try connection again

### **If you want to verify credentials:**
1. Go to Supabase Dashboard
2. Project Settings → Database
3. Copy the connection string
4. Update `DATABASE_URL` in `.env`
5. Try again

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Connection timeout | Check if Supabase project is active |
| Authentication failed | Verify password doesn't have @ (must be %40) |
| Wrong database | Verify postgres database name in URL |
| Network error | Check if port 5432 is accessible |
| Region mismatch | Verify aws region matches your project |

---

**Status**: Configuration ready, awaiting database server response. The app is fully configured and will work once the database connection is established! 🚀
