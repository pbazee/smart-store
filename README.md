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

That's it! The store runs fully on mock data (20 Kenyan-style products).

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

### 2. Update `.env.local`

```env
# Change this to false
USE_MOCK_DATA=false

# Add your real credentials
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Paystack (Kenya payments)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_SECRET_KEY="sk_live_..."

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

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

## 🚀 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard:
# Project > Settings > Environment Variables
# Copy all vars from .env.local
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
| Auth | Clerk (when live) |
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
