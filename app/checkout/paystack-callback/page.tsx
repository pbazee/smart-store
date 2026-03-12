"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

const PAYSTACK_COMPLETE_MESSAGE = "paystack:complete";

function PaystackCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference") ?? searchParams.get("trxref") ?? searchParams.get("transaction");

  useEffect(() => {
    if (!reference) {
      router.replace("/checkout");
      return;
    }

    if (window.opener && window.opener !== window) {
      window.opener.postMessage(
        {
          type: PAYSTACK_COMPLETE_MESSAGE,
          reference,
        },
        window.location.origin
      );
      window.close();
      return;
    }

    router.replace(`/checkout/complete?reference=${encodeURIComponent(reference)}`);
  }, [reference, router]);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
      <h1 className="text-2xl font-black">Finalizing Paystack checkout</h1>
      <p className="mt-3 text-muted-foreground">
        We&apos;re returning you to the order confirmation screen now.
      </p>
    </div>
  );
}

export default function PaystackCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="text-2xl font-black">Finalizing Paystack checkout</h1>
          <p className="mt-3 text-muted-foreground">
            We&apos;re returning you to the order confirmation screen now.
          </p>
        </div>
      }
    >
      <PaystackCallbackContent />
    </Suspense>
  );
}
