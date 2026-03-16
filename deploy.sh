#!/bin/bash
# Quick deployment script for all fixes

cd c:/Projects/smartest-store-ke

echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix errors above and try again."
  exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🔄 Staging changes..."
git add .

echo "📝 Creating commit..."
git commit -m "fix: Mobile UX, sign-out menu, checkout performance optimization

Improvements:
- Mobile header simplification (logo, search, theme, menu only)
- Cart & Wishlist moved to menu drawer for mobile
- Fixed stale session state in menu after sign-out
- Parallelized checkout queries for faster Paystack load
- Added real-time session detection in menus

These changes improve mobile UX and checkout performance significantly.

Note: If Clerk JS fails to load, regenerate keys in Clerk Dashboard
and update NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY & CLERK_SECRET_KEY in env vars.

See CHECKOUT_AND_AUTH_FIXES.md for detailed documentation."

echo "🚀 Pushing to main..."
git push origin main

echo ""
echo "✅ All changes pushed! Vercel is deploying now."
echo "Check https://smart-store-iota.vercel.app in 2-3 minutes"
