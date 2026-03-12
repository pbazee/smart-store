# Clerk Authentication Setup Guide

This document outlines the Clerk authentication implementation for Smartest Store KE.

## Implementation Overview

### ✅ What's Been Implemented

1. **ClerkProvider** - Wrapped in root layout (`app/layout.tsx`)
2. **Authentication Pages**
   - `/auth/sign-in` - User login page with Clerk UI
   - `/auth/sign-up` - User registration page with Clerk UI
3. **Middleware** - Route protection and public/private route configuration
4. **Auth Utilities** - Helper functions for checking authentication and admin roles
5. **Protected Admin Layout** - Admin panel with Clerk integration

### 📋 Files Added/Modified

```
app/
  ├── layout.tsx                    [MODIFIED] - Added ClerkProvider
  ├── auth/
  │   ├── sign-in/
  │   │   └── page.tsx             [NEW] - Sign in page
  │   └── sign-up/
  │       └── page.tsx             [NEW] - Sign up page
  └── admin/
      └── layout-protected.tsx      [NEW] - Protected admin layout with auth

middleware.ts                       [NEW] - Route protection middleware
lib/
  └── auth-utils.ts               [NEW] - Authentication helper functions
```

## Setup Instructions

### 1. Install Clerk Dependencies

```bash
npm install @clerk/nextjs
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with your Clerk credentials:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin
```

### 3. Get Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application (if you haven't already)
3. Navigate to "API Keys" in the sidebar
4. Copy your `Publishable Key` and `Secret Key`
5. Add them to your `.env.local` file

### 4. Create Admin Database (Optional)

To enable role-based access control, you can extend the user model in Prisma:

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  role      String   @default("user")  // "user" or "admin"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders Order[]
}

enum UserRole {
  USER
  ADMIN
}
```

## Route Configuration

### Public Routes (No Authentication Required)
- `/` - Home page
- `/shop/*` - Shop pages
- `/product/*` - Product pages
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/api/products/*` - API endpoints for products
- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page

### Protected Routes (Authentication Required)
- `/admin/*` - All admin pages require authentication
- `/account/*` - User account pages (can be configured)

## Usage Examples

### Client Components

```typescript
// Sign out user
import { SignOutButton } from "@clerk/nextjs";

export function LogoutButton() {
  return <SignOutButton />;
}

// Display user info
import { useAuth, useUser } from "@clerk/nextjs";

export function UserProfile() {
  const { userId } = useAuth();
  const { user } = useUser();
  
  if (!user) return null;
  
  return <div>{user.primaryEmailAddress?.emailAddress}</div>;
}
```

### Server Components

```typescript
// Protect server functions
import { requireAuth, requireAdminAuth } from "@/lib/auth-utils";

export async function getProtectedData() {
  const userId = await requireAuth();
  // User is authenticated, proceed...
}

export async function getAdminData() {
  const userId = await requireAdminAuth();
  // User is admin, proceed...
}
```

## Updating Admin Layout

The current admin layout is in `app/admin/layout.tsx`. To migrate it to use the protected version:

1. Rename current `app/admin/layout.tsx` to `app/admin/layout-original.tsx` (backup)
2. Rename `app/admin/layout-protected.tsx` to `app/admin/layout.tsx`

Or manually merge the `UserButton` component from the protected version.

## Setting Up Admin Roles

### Option 1: Using Clerk Custom Claims (Recommended)

1. In your Clerk dashboard, go to JWT Templates
2. Add a custom claim for role:
   ```json
   {
     "metadata": {
       "role": "{{user.public_metadata.role}}"
     }
   }
   ```
3. Use the `isAdminUser()` function from `lib/auth-utils.ts`

### Option 2: Using Database

Implement a User model in Prisma and check the database for role information.

## Testing Authentication

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/auth/sign-up
3. Create a test account
4. You should be redirected to `/admin` after sign up
5. Try navigating to protected routes

## Troubleshooting

### "ClerkProvider is not defined"
- Make sure you've installed `@clerk/nextjs`: `npm install @clerk/nextjs`
- Restart your dev server after installation

### Environment variables not loading
- Create `.env.local` (not `.env`)
- Restart your dev server after adding env variables
- Check that you've copied the keys correctly from Clerk dashboard

### Redirect loops
- Ensure `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` is set correctly
- Check that the redirect URL is a valid protected route

### Middleware not intercepting routes
- Make sure `middleware.ts` exists at the project root
- Restart dev server after creating middleware file

## Next Steps

1. **Set up database-based roles** - Extend Prisma schema with User model
2. **Configure webhook** - Use Clerk webhooks to sync user data to your database
3. **Add admin-only pages** - Create role-based access control
4. **Customize sign-in/sign-up** - Further style the Clerk components
5. **Add SSO** - Enable social login (Google, GitHub, etc.)

## Resources

- [Clerk Next.js Documentation](https://clerk.com/docs/nextjs/overview)
- [Clerk Authentication API](https://clerk.com/docs/reference/backend-api)
- [Custom JWT Claims](https://clerk.com/docs/backend-requests/resources/jwt-templates)
