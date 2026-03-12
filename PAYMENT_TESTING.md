# Paystack Payment Integration Testing Guide

## Overview
This smartest-store-ke ecommerce platform uses **Paystack** for payment processing. This guide covers testing payment flows, webhook verification, and troubleshooting.

---

## Setup for Payment Testing

### 1. Get Paystack Credentials

#### Create Paystack Account
1. Go to [Paystack.com](https://paystack.com)
2. Sign up for a Business account
3. Verify email
4. Complete KYC (Know Your Customer) - provide business details
5. Go to Settings → API Keys & Webhooks

#### Get Test Keys
1. **API Keys** section:
   - Copy **Public Key** (starts with `pk_test_`)
   - Copy **Secret Key** (starts with `sk_test_`)
2. Enable **Test Mode** toggle in top-right

#### Update Environment
In `.env.local`:
```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
```

Restart development server: `npm run dev`

---

## Test Cards

### Successful Payment (3D Secure)
| Field | Value |
|-------|-------|
| Card Number | `4084 0840 8408 4081` |
| Expiry | Any future date (e.g., 12/31) |
| CVV | Any 3 digits (e.g., 123) |
| OTP | `123456` |
| Final Verification | Tap any button |

### Test Card (No 3D Secure)
| Field | Value |
|-------|-------|
| Card Number | `5060 6666 6666 6666` |
| Expiry | Any future date |
| CVV | Any 3 digits |

### Decline Scenarios
| Scenario | Card Number |
|----------|-------------|
| Insufficient Funds | `4024 8803 0008 0001` |
| Expired Card | `4111 1111 1111 1111` (set expiry to past date) |
| Invalid CVC | `5531 8866 5214 2950` |

---

## Testing Complete Payment Flow

### 1. User Browsing & Cart
```
1. Navigate to http://localhost:3000/shop
2. Browse products
3. Add 2-3 items to cart
4. Open cart drawer → Proceed to Checkout
```

**Expected:**
- Cart shows correct items and prices
- Checkout page loads with customer form

### 2. Checkout Process
```
1. Enter customer details:
   - First Name: Test User
   - Last Name: Tester
   - Email: test@example.com
   - Phone: +254712345678
2. Choose Shipping (Free, Flat Rate, Express)
3. Navigate to Payment
4. Select Payment Method: Card (Paystack)
5. Review Order Summary
```

**Expected:**
- All totals calculated correctly
- Shipping cost applied
- Submit button enabled

### 3. Payment Submission
```
1. Click "Place Order" button
2. Button shows "Initializing payment..."
3. Wait 2-3 seconds
```

**Expected:**
- Modal/loading screen appears
- No errors in browser console

### 4. Paystack Hosted Page
```
1. Redirected to Paystack payment page
2. Shows payment amount in KES
3. Shows merchant name
```

**Expected:**
- URL changes to `https://checkout.paystack.com/...`
- Order details visible

### 5. Card Entry
```
1. Use test card: 4084 0840 8408 4081
2. Enter expiry: 12/31 (or any future date)
3. Enter CVV: 123
4. Click "Pay"
```

**Expected:**
- OTP prompt appears (for 3D Secure cards)

### 6. OTP Entry
```
1. Wait for OTP modal
2. Enter: 123456
3. Click "Verify"
```

**Expected:**
- Paystack processes payment
- Shows "Payment successful" or similar

### 7. Confirmation Page
```
Expected redirect to: http://localhost:3000/order-confirmation/[orderNumber]
```

**Verify on Page:**
- ✅ Order number matches
- ✅ Status shows "Processing" (payment confirmed)
- ✅ Payment status shows "Paid"
- ✅ Order items listed correctly
- ✅ Total amount correct
- ✅ Shipping address displayed
- ✅ "View Orders" button links to /orders

### 8. User Orders Page
```
Navigate to http://localhost:3000/orders
```

**Verify:**
- ✅ New order appears in list
- ✅ Status shows as "Processing" (was "Pending" before payment)
- ✅ Order number, date, total visible
- ✅ Clicking order opens detail/confirmation page

---

## Payment Failure Scenarios

### Decline Payment
```
1. Use declining test card: 4024 8803 0008 0001
2. Complete payment flow
3. Paystack shows "Payment declined"
```

**Expected:**
- Error message shown
- Redirects back to checkout form
- Cart items preserved
- Can retry with different card

### Mock API Failure
```
1. Disable internet briefly during payment init
```

**Expected:**
- Alert: "Failed to initialize payment"
- Cart preserved
- "Try Again" option available

### Webhook Not Received
```
1. Payment successful on Paystack
2. But database shows "pending" status
```

**Troubleshooting:**
- Check webhook URL in Paystack settings
- Verify webhook: Settings → Webhooks → /api/webhooks/paystack
- Check server logs for webhook errors
- Manually verify transaction:
  ```bash
  curl -H "Authorization: Bearer sk_test_..." \
    https://api.paystack.co/transaction/verify/REFERENCE
  ```

---

## Webhook Testing

### Setup Webhook URL
1. Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
   - In development: Use localhost (not accessible from Paystack)
   - Use [ngrok](https://ngrok.com) to expose localhost:
   ```bash
   ngrok http 3000
   # Copy provided URL: https://xxxx-xx-xxx-xx-xx.ngrok.io
   # Webhook URL: https://xxxx-xx-xxx-xx-xx.ngrok.io/api/webhooks/paystack
   ```

3. Select events: **Charge Successful**
4. Save

### Manual Webhook Trigger
Test webhook without real payment:
```bash
# 1. Trigger test event in Paystack dashboard
# Settings → Webhooks → Send test

# 2. Or manually send (requires signature)
curl -X POST http://localhost:3000/api/webhooks/paystack \
  -H "Content-Type: application/json" \
  -d '{
    "event": "charge.success",
    "data": {
      "id": 123456789,
      "reference": "test_ref_12345",
      "amount": 50000,
      "currency": "NGN",
      "status": "success"
    }
  }' \
  -H "x-paystack-signature: SIGNATURE"
```

### Webhook Verification
Check logs:
```bash
# Terminal logs should show:
# "✅ Webhook signature verified"
# "✅ Transaction verified with Paystack"
# "✅ Order updated: Processing"

# Check database:
# Order status should change from "pending" → "processing"
# paymentStatus should change from "pending" → "paid"
```

---

## Database Verification

### Check Order After Payment

```sql
-- Query successful order
SELECT * FROM "Order" 
WHERE "paystackReference" = 'your_reference_here'
LIMIT 1;

-- Expected output:
-- id: [uuid]
-- orderNumber: ORD#123456
-- userId: [clerk_user_id]
-- status: "processing" (after webhook)
-- paymentStatus: "paid" (after webhook)
-- paystackReference: "unique_ref_string"
-- total: 50000 (in KES)
-- createdAt: [timestamp]
```

### Check OrderItems
```sql
-- Verify items in order
SELECT oi.*, p."name" FROM "OrderItem" oi
JOIN "Order" o ON oi."orderId" = o.id
JOIN "Product" p ON oi."productId" = p.id
WHERE o."paystackReference" = 'your_reference_here';

-- Expected: All items from cart
```

---

## Troubleshooting Payment Issues

### Payment Initialized But No Redirect
**Symptom:** Button shows "Initializing payment..." but nothing happens

**Causes & Fixes:**
1. Invalid API keys
   - Verify keys in .env match Paystack dashboard
   - Check for leading/trailing spaces
2. Network error
   - Check browser console for fetch errors
   - Verify internet connection
3. Missing PAYSTACK_SECRET_KEY
   - Required in .env for backend
   - Development server must be restarted after changes

**Solution:**
```bash
# 1. Verify environment
echo $PAYSTACK_SECRET_KEY

# 2. Restart server
npm run dev

# 3. Check browser console (F12)
# Look for error in Network → checkout/initialize-payment
```

### Order Created But Status Stuck as "Pending"
**Symptom:** Order exists in database but status doesn't update after Paystack success

**Causes:**
1. Webhook URL not set in Paystack
2. Webhook signature verification failing
3. Order ID mismatch in webhook handler

**Debug:**
```bash
# Check server logs for webhook errors
# Should see one of:
# - "❌ Invalid webhook signature"
# - "❌ Transaction verification failed"  
# - "✅ Order updated successfully"

# Verify webhook URL in Paystack:
# Settings → Webhooks → Check destination URL
```

**Fix:**
1. Get webhook URL from Paystack settings
2. Verify it matches: `https://yourdomain.com/api/webhooks/paystack`
3. Use ngrok (dev) or Vercel (production) to expose endpoint
4. Resend test webhook from Paystack dashboard

### Card Declined Error
**Symptom:** Paystack shows "Card declined" for valid test card

**Causes:**
1. Using expired test card (check expiry date)
2. Using production card in test mode (vice versa)
3. Paystack account not in test mode

**Fix:**
```
1. Verify card number is exactly: 4084 0840 8408 4081
2. Verify Paystack dashboard shows "Test Mode: ON"
3. Try different test card: 5060 6666 6666 6666
4. Check API keys are sk_test_ or pk_test_ (not sk_live_)
```

### Webhook Signature Invalid
**Symptom:** Logs show "Invalid webhook signature"

**Causes:**
1. PAYSTACK_SECRET_KEY is incorrect
2. Using production key in test mode (or vice versa)
3. Secret key changed but server not restarted

**Fix:**
```bash
# 1. Verify secret key
# Paystack Dashboard → Settings → API Keys & Webhooks
# Copy the correct sk_test_ key

# 2. Update .env.local
PAYSTACK_SECRET_KEY=sk_test_your_correct_key_here

# 3. Restart server
npm run dev

# 4. Resend test webhook
# Paystack Dashboard → Settings → Webhooks → Send test
```

---

## Performance Metrics

### Expected Payment Time
- **Payment init**: 0.5-1.5 seconds (API call + order creation)
- **Paystack redirect**: <1 second
- **Card entry**: Customer time (~30 seconds typical)
- **Verification**: 1-3 seconds
- **Webhook processing**: <1 second
- **Total user experience**: ~60 seconds for full flow

### Error Response Times
- **Invalid card**: Instant (~200ms)
- **Network error**: 3-10 seconds (timeout)
- **Invalid signature**: <100ms (webhook rejected)

---

## Production Checklist

Before deploying to production:

- [ ] Switch to **Live** mode in Paystack
- [ ] Get live API keys (pk_live_, sk_live_)
- [ ] Update .env with live keys
- [ ] Test 1-2 real payments with live cards
- [ ] Enable webhook signature verification
- [ ] Set up proper error logging/monitoring
- [ ] Configure email notifications for orders
- [ ] Test refund process
- [ ] Set up transaction reconciliation job
- [ ] Document support process for payment issues

---

## Support Resources

- **Paystack Docs**: https://paystack.com/docs
- **Paystack Test Cards**: https://paystack.com/docs/payments/test-authorization
- **API Reference**: https://paystack.com/docs/api
- **Troubleshooting**: https://paystack.com/docs/troubleshooting
- **Chat Support**: https://paystack.com/support

---

**Last Updated:** March 9, 2026  
**Version:** 1.0.0-MVP  
**Status:** Ready for Testing
