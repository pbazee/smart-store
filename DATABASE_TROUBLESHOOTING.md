# 🔧 Database Connection Troubleshooting

## Current Issue
`Can't reach database server at db.vqqiyqmlckwknutlbfvw.supabase.co:5432`

---

## ✅ What We've Successfully Configured

1. **Environment Variables**
   - ✅ `.env` and `.env.local` configured with all keys
   - ✅ DATABASE_URL properly formatted with URL encoding for special characters
   - ✅ Supabase, Clerk, and Paystack credentials set

2. **Backend Integration**
   - ✅ API routes updated to use Prisma ORM
   - ✅ Data service layer created for unified data fetching
   - ✅ Frontend pages made async for server-side data loading

3. **Database Schema**
   - ✅ Prisma schema defined (Product, Variant, Order models)
   - ✅ Seed script created to populate 20 products

---

## 🔍 Things to Check

### 1. Verify Supabase Project is Active
- Go to https://supabase.com/dashboard
- Sign in and select your project
- Check if the database is running (green status)
- Verify you can access "SQL Editor" tab

### 2. Verify Connection String
```
Expected format:
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres

Your configured format:
postgresql://postgres:0746284433%40Peter@db.vqqiyqmlckwknutlbfvw.supabase.co:5432/postgres

Check:
- ✅ Host: db.vqqiyqmlckwknutlbfvw.supabase.co (correct)
- ✅ Port: 5432 (correct)
- ✅ Database: postgres (correct)
- Password with @ encoded as %40 (correct)
```

### 3. Get Connection String from Supabase
```bash
# In Supabase Dashboard:
1. Go to Project Settings → Database
2. Find "Connection pooling" OR "Direct connection"
3. Click "URI" tab
4. Copy the full connection string
5. Replace the [YOUR-PASSWORD] placeholder
6. Update .env.local
```

### 4. Test Connection Locally (Optional)
If you have psql installed:
```bash
psql "postgresql://postgres:0746284433@Peter@db.vqqiyqmlckwknutlbfvw.supabase.co:5432/postgres"
```

### 5. Check Network Connectivity
```bash
# Test if server is reachable
ping db.vqqiyqmlckwknutlbfvw.supabase.co
```

---

## 🚀 Once Connection Works

Run these commands in order:

```bash
# 1. Create tables in Supabase
npx prisma db push

# 2. Populate with 20 products
npm run prisma:seed

# 3. Start dev server
npm run dev
```

---

## 🔄 Alternative: Use Prisma Migrate

If `prisma db push` continues to fail:

```bash
# Generate migration file
npx prisma migrate dev --name init

# Then seed
npm run prisma:seed
```

---

## 📝 Configuration Files Ready

All these files have been updated and are ready:

```
.env                           ← Environment variables
.env.local                      ← Backup environment variables
prisma/schema.prisma           ← Database schema (Product, Variant, Order)
prisma/seed.ts                 ← Seed script (20 products)
lib/data-service.ts            ← Data service layer
app/api/products/route.ts      ← API endpoint (database-aware)
app/api/orders/route.ts        ← API endpoint (database-aware)
app/page.tsx                   ← Homepage (async, uses data-service)
app/product/[slug]/page.tsx    ← Product detail (async, uses data-service)
```

---

## ✨ What Happens After Connection Succeeds

Your app will immediately start using:
- ✅ Real PostgreSQL database for products
- ✅ Real product inventory and variants
- ✅ Real order tracking
- ✅ Prisma ORM for type-safe queries
- ✅ Clerk authentication
- ✅ Paystack payment processing
- ✅ Admin dashboard with real data

---

## 💡 Tips

1. **Keep .env and .env.local in sync** - Both files should have the same DATABASE_URL
2. **URL-encode special characters** - The @ in the password must be %40
3. **Use Supabase directly** - Test connection through Supabase dashboard first
4. **Check Supabase logs** - Go to Logs → Postgres Logs if connection fails
5. **Verify project region** - Make sure you're connecting to correct region

---

## Next Step for You

**Please verify your Supabase credentials** and the connection string, then run:
```bash
npx prisma db push
```

Once this succeeds, the database will be set up and ready for the seed script!

