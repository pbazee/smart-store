# ⚡ PRODUCTION DEPLOYMENT CHECKLIST (5 Minutes)

## Your Action Items - Do These in Order

### ✅ Step 1: Commit & Deploy Code (2 min)

```bash
cd /path/to/smartest-store-ke

git add .

git commit -m "Fix: Customer auth forms and production setup docs"

git push origin main
```

Then wait for Vercel to auto-deploy (watch at https://vercel.com/dashboard)

---

### ✅ Step 2: Add Vercel Environment Variables (2 min)

Go to: **https://vercel.com/dashboard** → Your Project → **Settings** → **Environment Variables**

**Add these ONE BY ONE** (select all three environments for each):

1. **`AUTH_SESSION_SECRET`**
   - Value: Run this in terminal: `openssl rand -base64 32`
   - Copy the output, paste it here

2. **`DATABASE_URL`**
   - Go to Supabase Dashboard → Settings → Database → Connection Pooler
   - Copy the PostgreSQL URI
   - Add query params: `?sslmode=require&pgbouncer=true&connection_limit=10&connect_timeout=30&pool_timeout=60`
   - Paste full URL here

3. **`DIRECT_URL`**
   - Go to Supabase Dashboard → Settings → Database → Cll onnection String
   - Copy the PostgreSQL URI (NOT the pooler - the regular one on port 5432)
   - Add query params: `?sslmode=require&connection_limit=10&pool_timeout=60`
   - Paste full URL here

4. **`NEXT_PUBLIC_SUPABASE_URL`**
   - Supabase Dashboard → Settings → API
   - Copy "Project URL"
   - Paste here

5. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - Same page: Copy "Anon Key"
   - Paste here

6. **`SUPABASE_SERVICE_ROLE_KEY`**
   - Same page: Scroll down, copy "Service Role Secret"
   - Paste here

7. **`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`**
   - Paystack Dashboard → Settings → API Keys & Webhooks
   - Copy "Live Public Key" (NOT test)
   - Paste here

8. **`PAYSTACK_SECRET_KEY`**
   - Same page: Copy "Live Secret Key" (NOT test)  
   - Paste here

9. **`RESEND_API_KEY`**
   - Go to https://resend.com → API Keys
   - Copy your key
   - Paste here

10. **`USE_MOCK_DATA`**
    - Value: `false`

---

### ✅ Step 3: Redeploy (1 min)

In Vercel:
1. Go to the deployment page
2. Click **...** on the latest deployment
3. Click **Redeploy**
4. Wait for it to finish (look for checkmark)

---

## ✅ Testing - Did It Work?

Visit your Vercel URL and test:

- [ ] **Homepage loads** - No errors
- [ ] **Sign-up works** - Can create account with email/password
- [ ] **Sign-in works** - Can log in with email/password
- [ ] **Shop page works** - Can browse products
- [ ] **Add to cart works** - Can add items
- [ ] **Checkout loads** - NO "Database connection failed" error
- [ ] **Paystack initializes** - Can proceed to payment

If all pass ✅ → **YOU'RE DONE!**

If any fails ❌ → See "Troubleshooting" below

---

## ❌ Troubleshooting

### Problem: "Database connection failed" on checkout

**Check:**
1. Go to Vercel Settings → Environment Variables
2. Verify `DATABASE_URL` is set (not empty)
3. Verify `DIRECT_URL` is set (not empty)
4. Check they include ALL query params (sslmode, pgbouncer, etc.)
5. Click Redeploy

**Still not working?**
- Copy DATABASE_URL from Supabase again, ensure no extra spaces
- Make sure you used POOLED URL (port 6543) for DATABASE_URL
- Make sure you used DIRECT URL (port 5432) for DIRECT_URL

### Problem: Sign-in/sign-up page shows old Clerk version

**Fix:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check git + Vercel deployment completed
4. If still wrong, verify files were updated in your code

### Problem: Sign-in says "Invalid email or password"

**Check:**
1. Are you using the exact email you signed up with?
2. Is the password at least 8 characters?
3. Try signing up again with a new email

### Problem: Vercel build failed

**Check logs:**
1. Go to Vercel Dashboard
2. Click on the deployment
3. Click "Logs" tab
4. Scroll down for red error messages
5. Common issues:
   - TypeScript errors (make sure files were saved correctly)
   - Missing environment variables (see Step 2 above)

---

## ✅ Complete - What Changed

### Users can now:
- ✅ Sign up with email/password (instead of only Google)
- ✅ Sign in with email/password
- ✅ Checkout without database errors
- ✅ Complete full purchase flow

### Admin:
- ✅ Have detailed deployment guide (VERCEL_PRODUCTION_SETUP.md)
- ✅ Have clear environment variable documentation (.env.example)
- ✅ Can troubleshoot connection issues easily

---

## 📞 Quick Reference

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_SUMMARY.md` | What was changed and why |
| `VERCEL_PRODUCTION_SETUP.md` | Detailed step-by-step guide (if you need more details) |
| `README.md` | Updated with link to production guide |
| `.env.example` | Updated with detailed docs for each variable |

---

**Time to complete:** 5 minutes  
**Difficulty:** ⭐ Easy (copy-paste values, no coding needed)  
**Status:** Ready for production
