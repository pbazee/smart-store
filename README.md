# Smartest Store KE 🇰🇪

Kenya's smartest fashion ecommerce platform. Built with Next.js 15, featuring M-Pesa payments, Nairobi delivery, and a full admin dashboard.

## ⚡ Run Demo in 30 Seconds

```bash
# 1. Clone / extract the project
cd smartest-store-ke

# 2. Install dependencies
npm install   
  
# 3. Start dev server (uses mock data by default — no DB needed!)
npm run dev

# 4. Open http://localhost:3000
```

That's it! The store runs fully on mock data (20 Kenyan-style products). But make sure to remove all mock data after you finish everything. 

---

## 🏗️ Project Structure

```
smartest-store-ke/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx            # Homepage (hero, featured, trending)
│   ├── shop/page.tsx       # Shop with filters
│   ├── product/[slug]/     # Product detail page
│   ├── cart/page.tsx       # Full cart page
│   ├── checkout/page.tsx   # Multi-step checkout
│   ├── admin/              # Admin dashboard (protected)
│   │   ├── page.tsx        # Dashboard with charts
│   │   ├── products/       # Products CRUD table
│   │   ├── orders/         # Orders management
│   │   └── settings/       # Integration settings
│   └── api/                # REST API routes
├── components/
│   ├── layout/             # Navbar, Footer, ThemeProvider
│   ├── shop/               # ProductCard, CartDrawer, HeroCarousel, etc.
│   └── admin/              # Admin-specific components
├── lib/
│   ├── store.ts            # Zustand (cart + demo state)
│   ├── mock-data.ts        # Mock data helpers
│   ├── utils.ts            # formatKES, cn, etc.
│   └── use-toast.ts        # Toast notifications
├── mock/
│   ├── products.json       # 20 Kenyan products with variants
│   └── orders.json         # Sample orders
├── prisma/
│   └── schema.prisma       # DB schema (for when USE_MOCK_DATA=false)
└── types/index.ts          # TypeScript interfaces
```

---

## 🔧 How to Switch to Real Database

### 1. Set up Supabase

```bash
# Create a project at https://supabase.com
# Get your DATABASE_URL from Settings > Database
```

#### Clean Branding for Google Auth (Important!)
To ensure the Google Sign-in consent screen shows your brand name instead of a Supabase URL:
1. Go to Supabase Dashboard → Authentication → Settings.
2. Look for **Site URL** and set it to your main domain (e.g. `https://smartest-store-ke.com`).
3. Look for the **Project name** field and set it to a clean, branded name like `Smartest Store KE`.
4. *(If you use your own Google Cloud OAuth app)* Go to Google Cloud Console → APIs & Services → OAuth consent screen and set the "App name" to `Smartest Store KE`.

### 2. Update `.env.local`

```env
# Change this to false
USE_MOCK_DATA=false

# Add your real credentials
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Paystack (Kenya payments)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_SECRET_KEY="sk_live_..."

# Email (Resend)
RESEND_API_KEY="re_..."
# Optional: verified sender
RESEND_FROM_EMAIL="Smartest Store KE <onboarding@resend.dev>"
```

### 3. Run Prisma migrations

```bash
npx prisma migrate dev --name init
npx prisma db seed  # Seeds the 20 products from mock data
```

---

## 💳 Payment Setup (Paystack + M-Pesa)

1. Create account at [paystack.com](https://paystack.com)
2. Get API keys from Dashboard > Settings > API Keys
3. Add `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY` to `.env.local`
4. Set webhook URL: `https://your-domain.com/api/webhook/paystack`

---

## 🚀 Production Deployment (Vercel + Supabase)

For a complete step-by-step guide including Supabase configuration, environment variables, and troubleshooting, see:

**📋 [VERCEL_PRODUCTION_SETUP.md](./VERCEL_PRODUCTION_SETUP.md)** ← Start here!

### Quick Deploy Summary

1. **Set up Supabase** (detailed in linked guide above)
   - Get DATABASE_URL (pooled) and DIRECT_URL
   - Get NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

2. **Add Environment Variables in Vercel**
   ```bash
   AUTH_SESSION_SECRET
   DATABASE_URL (pooled connection)
   DIRECT_URL (direct connection)
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
   PAYSTACK_SECRET_KEY
   RESEND_API_KEY
   USE_MOCK_DATA=false
   ```

3. **Deploy**
   ```bash
   git push origin main  # Auto-deploys via Vercel
   ```

4. **Verify** - Check Vercel Logs for database connection messages

See [VERCEL_PRODUCTION_SETUP.md](./VERCEL_PRODUCTION_SETUP.md) for full instructions with exact Supabase copy-paste values.

---

## 🚀 Deploy to Vercel (Quick Button)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Animation | Framer Motion |
| State | Zustand |
| Tables/Charts | TanStack Table + Recharts |
| Forms | React Hook Form + Zod |
| Carousel | Embla Carousel |
| Database | Prisma + Supabase (when live) |
| Auth | Supabase Auth (when live) |
| Payments | Paystack + Stripe (when live) |
| Email | Resend (order confirmations + admin alerts) |
| Deployment | Vercel |

---

## 🇰🇪 Kenyan Features

- **M-Pesa integration** — Paystack handles M-Pesa STK push
- **KES pricing** — All prices in KSh format
- **Nairobi delivery** — Location-based delivery options
- **Local street names** — Products named after Nairobi neighborhoods
- **Trust badges** — M-Pesa, Safaricom, local delivery indicators

---

## 📱 Demo Admin

Visit `/admin` to see the full admin dashboard:
- Revenue charts (Recharts)
- Products CRUD table
- Orders management with status updates
- Low stock alerts
- Demo mode banner (toggle to "connect" real DB)

---

Made with ❤️ in Nairobi, Kenya 🇰🇪
# BestShop
