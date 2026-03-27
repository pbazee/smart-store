import { getSupportContactInfo } from "@/lib/support-contact";

export default async function ReturnsPage() {
  const { supportEmail, supportPhone, supportTel } = await getSupportContactInfo();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4">Returns & Exchanges</h1>
        <p className="text-xl text-muted-foreground">
          Easy returns and exchanges within 30 days
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-2xl font-bold mb-6">Return Policy</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">30</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">30-Day Return Window</h3>
                <p className="text-muted-foreground text-sm">
                  Return any item within 30 days of delivery for a full refund or exchange.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Items Must Be Unused</h3>
                <p className="text-muted-foreground text-sm">
                  Items must be in original condition with tags attached and packaging intact.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Free Returns in Nairobi</h3>
                <p className="text-muted-foreground text-sm">
                  We cover return shipping costs for Nairobi deliveries. Other locations pay return shipping.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">How to Return</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold">Contact Us</h3>
                <p className="text-muted-foreground text-sm">
                  Email {supportEmail} or call {supportPhone} with your order number.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold">Pack Your Items</h3>
                <p className="text-muted-foreground text-sm">
                  Use the original packaging and include all accessories, tags, and documentation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold">Ship It Back</h3>
                <p className="text-muted-foreground text-sm">
                  We'll provide a return label and pickup instructions for Nairobi customers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold">Get Refunded</h3>
                <p className="text-muted-foreground text-sm">
                  Refunds are processed within 3-5 business days after we receive your return.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-8">
        <h2 className="text-2xl font-bold mb-4">Exchanges</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Size Exchanges</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Need a different size? We offer free size exchanges within Nairobi for the first exchange.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Free for Nairobi customers</li>
              <li>• Must be within 7 days of delivery</li>
              <li>• Item must be unworn with tags</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Product Exchanges</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Want a different product? Exchange for any item of equal or greater value.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Pay difference for higher value items</li>
              <li>• Refund difference for lower value items</li>
              <li>• Same return conditions apply</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <div className="bg-muted/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Questions About Returns?</h2>
          <p className="text-muted-foreground mb-6">
            Our customer service team is here to help with any return or exchange questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Contact Us
            </a>
            <a
              href={`tel:${supportTel}`}
              className="inline-block border border-border hover:bg-muted text-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Call {supportPhone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
