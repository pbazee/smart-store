# Quick Action Checklist - Fix Production Parity

Complete these steps to fix the Vercel deployment parity issue.

## 🔴 CRITICAL - Do First (5 min)

### 1. Update Vercel Environment Variables
Go to: https://vercel.com/dashboard → smart-store-ke → Settings → Environment Variables

**Remove these if they exist** (test keys):
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...`  
- `PAYSTACK_SECRET_KEY=sk_test_...`

**Add/Update these** (copy exact values from your live accounts):

| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://smart-store-iota.vercel.app` | This URL exactly |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | `sk_live_...` | Clerk Dashboard → API Keys |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_live_...` (or test) | Paystack Dashboard |
| `PAYSTACK_SECRET_KEY` | `sk_live_...` (or test) | Paystack Dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROJECT].supabase.co` | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Supabase Dashboard |
| `RESEND_API_KEY` | Your API key | Resend Dashboard |
| `AUTH_SESSION_SECRET` | Generate with: `openssl rand -base64 32` | Generate new |

**Database URLs** (these are in your .env.local):
- `DATABASE_URL` - Copy from Supabase → Connection String (Pool URL)
- `DIRECT_URL` - Same as DATABASE_URL

### 2. Redeploy 
Vercel Dashboard → Deployments → Latest → ... → Redeploy

Or via git:
```bash
git push origin main
```

### 3. Check Logs (2 min)
After deployment completes:
1. Vercel Dashboard → Deployments → Latest
2. Click "Logs" tab
3. Look for these messages - if present, everything works:
```
[StoreSettings] Loaded from database
[Announcements] Loaded X announcements
[Categories] Loaded X categories
```

If you see error messages like:
```
[StoreSettings] Query failed: ECONNREFUSED
[Announcements] Database query failed
```
→ Database connection failed. Check DATABASE_URL variable.

---

## 🟡 IMPORTANT - Do Second (10 min)

### 4. Verify Production Database Has Data
1. Supabase Dashboard → Your project → SQL Editor
2. Run these queries:

```sql
-- Check store settings exist
SELECT * FROM "StoreSettings" LIMIT 1;

-- Check announcements exist
SELECT COUNT(*) FROM "AnnouncementMessage" WHERE "isActive" = true;

-- Check products exist
SELECT COUNT(*) FROM "Product" LIMIT 1;
```

**If empty**, you need to:
- Add StoreSettings record via Supabase dashboard (support email, phone, admin email)
- Re-import products if this is a fresh database
- Announcements will auto-seed on first request

### 5. Test the Live Site
Visit: https://smart-store-iota.vercel.app

Check:
- [ ] Homepage loads with correct title/image in browser
- [ ] Footer has support email/phone
- [ ] Shop page shows products
- [ ] Announcements/popups display
- [ ] Can navigate to product pages
- [ ] Contact form has correct email

---

## 🟢 DONE - Verify (5 min)

### 6. Compare with Localhost
Open both in browser:
- http://localhost:3000 (local)
- https://smart-store-iota.vercel.app (production)

Compare:
- [ ] Same products visible
- [ ] Same announcements shown  
- [ ] Same settings (support contact info)
- [ ] Same layout/styling
- [ ] Same functionality

If anything is missing on production, check Vercel logs for errors.

---

## 📚 Reference Documents

- **Full guide**: [VERCEL_SETUP.md](VERCEL_SETUP.md)
- **All fixes applied**: [PRODUCTION_PARITY_FIXES.md](PRODUCTION_PARITY_FIXES.md)
- **Setup overview**: [SETUP.md](SETUP.md)

---

## ⚠️ If Something Breaks

### Database Connection Error
```
[StoreSettings] Query failed: ECONNREFUSED
```
**Fix**: Check DATABASE_URL is correct
- Supabase → Connection String → Copy exactly
- Make sure it's the production database, not development

### Missing Environment Variable
```
Error: CLERK_SECRET_KEY is not set
```
**Fix**: Check Vercel Environment Variables page - variable might be missing or misspelled

### Auth Fails (users can't login)
**Cause**: Using test Clerk keys instead of live
**Fix**: Go to Clerk Dashboard → API Keys → Copy LIVE keys to Vercel

### Metadata Wrong (og:image broken)
**Cause**: NEXT_PUBLIC_APP_URL not set or wrong
**Fix**: 
```
NEXT_PUBLIC_APP_URL=https://smart-store-iota.vercel.app
```
(exact URL)

### Checkout Broken
**Cause**: PAYSTACK keys wrong or NEXT_PUBLIC_APP_URL missing
**Fix**: Check both variables in Vercel, redeploy

---

## 🎯 Success Criteria

Production matches localhost when:
1. ✅ Homepage displays same content
2. ✅ All admin settings (email, phone) visible
3. ✅ All announcements/popups show
4. ✅ Products display correctly
5. ✅ Checkout process complete
6. ✅ Vercel logs show successful database queries
7. ✅ No fallback warnings in logs

---

**Time to complete**: 15-20 minutes
**Estimated downtime**: 2 minutes (during redeploy)
**Rollback time**: 1 minute (if needed)
