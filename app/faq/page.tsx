export default function FAQPage() {
  const faqs = [
    {
      question: "Do you ship nationwide?",
      answer: "Yes! We ship to all major towns in Kenya including Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, and more. Delivery typically takes 1-3 business days within Nairobi and 2-5 business days to other locations."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept M-Pesa, Visa, Mastercard, and other major credit/debit cards. M-Pesa is our most popular payment method for Kenyan customers."
    },
    {
      question: "What's your return policy?",
      answer: "We offer a 30-day return window for unused items in original packaging. Returns are free within Nairobi. For other locations, customers cover the return shipping cost."
    },
    {
      question: "Do you offer international shipping?",
      answer: "Currently, we only ship within Kenya. We're working on expanding to other East African countries soon."
    },
    {
      question: "How do I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via SMS and email. You can also track your order on our website using your order number."
    },
    {
      question: "Are your products authentic?",
      answer: "Yes! All our products are 100% authentic and sourced directly from authorized distributors. We guarantee authenticity on all items."
    },
    {
      question: "Do you offer size exchanges?",
      answer: "Absolutely! If you need a different size, contact us within 7 days of delivery and we'll arrange a free exchange (Nairobi only) or size swap."
    },
    {
      question: "What's your customer service response time?",
      answer: "We typically respond to all inquiries within 2-4 hours during business hours (9AM-6PM EAT, Monday-Friday). For urgent order issues, we aim to respond within 1 hour."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground">
          Everything you need to know about shopping at Smartest Store KE
        </p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our customer service team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Contact Us
            </a>
            <a
              href="tel:+254700123456"
              className="inline-block border border-border hover:bg-muted text-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Call +254 700 123 456
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
