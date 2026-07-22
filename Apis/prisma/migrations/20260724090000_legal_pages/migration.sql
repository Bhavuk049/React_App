-- CreateTable: fixed set of admin-editable content pages shown on the storefront footer
CREATE TABLE "legal_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "legal_pages_slug_key" ON "legal_pages"("slug");

-- Seed the fixed set of pages with placeholder content — admin replaces via Settings.
INSERT INTO "legal_pages" ("id", "slug", "title", "content", "updatedAt") VALUES
('a1a1a1a1-0001-4000-8000-000000000001', 'privacy-policy', 'Privacy Policy', 'This is placeholder content for our Privacy Policy. Update this from Admin > Settings > Legal pages.

We collect basic information such as your name, email, phone number, and shipping address to process orders and provide customer support. We do not sell your personal information to third parties.

If you have questions about how your data is handled, please contact us using the details on our Contact page.', NOW()),
('a1a1a1a1-0002-4000-8000-000000000002', 'legal-notice', 'Legal Notice', 'This is placeholder content for our Legal Notice. Update this from Admin > Settings > Legal pages.

This website is operated by TheUniqPick. All content, product names, and images on this site are the property of TheUniqPick unless otherwise stated.

For any legal correspondence, please reach out via the contact details listed on our Contact page.', NOW()),
('a1a1a1a1-0003-4000-8000-000000000003', 'shipping-policy', 'Shipping Policy', 'This is placeholder content for our Shipping Policy. Update this from Admin > Settings > Legal pages.

Orders are typically processed within 1-2 business days. Delivery timelines vary depending on your location and the shipping method selected at checkout.

You will receive tracking information once your order has shipped. For questions about a specific order, please contact us.', NOW()),
('a1a1a1a1-0004-4000-8000-000000000004', 'terms-of-service', 'Terms of Service', 'This is placeholder content for our Terms of Service. Update this from Admin > Settings > Legal pages.

By using this website and placing an order, you agree to these terms. Prices and product availability are subject to change without notice.

We reserve the right to refuse or cancel any order at our discretion, including in cases of suspected fraud or errors in pricing.', NOW()),
('a1a1a1a1-0005-4000-8000-000000000005', 'refund-policy', 'Refund Policy', 'This is placeholder content for our Refund Policy. Update this from Admin > Settings > Legal pages.

If you are not satisfied with your order, please contact us within 7 days of delivery to request a return or exchange.

Refunds are processed to the original payment method once the returned item is received and inspected. Some items may not be eligible for return.', NOW());
