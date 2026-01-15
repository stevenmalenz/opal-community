hCaptcha

hCaptcha

Afrikaans

Albanian

Amharic

Arabic

Armenian

Azerbaijani

Basque

Belarusian

Bengali

Bulgarian

Bosnian

Burmese

Catalan

Cebuano

Chinese

Chinese Simplified

Chinese Traditional

Corsican

Croatian

Czech

Danish

Dutch

English

Esperanto

Estonian

Finnish

French

Frisian

Gaelic

Galacian

Georgian

German

Greek

Gujurati

Haitian

Hausa

Hawaiian

Hebrew

Hindi

Hmong

Hungarian

Icelandic

Igbo

Indonesian

Irish

Italian

Japanese

Javanese

Kannada

Kazakh

Khmer

Kinyarwanda

Kirghiz

Korean

Kurdish

Lao

Latin

Latvian

Lithuanian

Luxembourgish

Macedonian

Malagasy

Malay

Malayalam

Maltese

Maori

Marathi

Mongolian

Nepali

Norwegian

Nyanja

Oriya

Persian

Polish

Portuguese (Brazil)

Portuguese (Portugal)

Pashto

Punjabi

Romanian

Russian

Samoan

Shona

Sindhi

Sinhalese

Serbian

Slovak

Slovenian

Somali

Southern Sotho

Spanish

Sundanese

Swahili

Swedish

Tagalog

Tajik

Tamil

Tatar

Teluga

Thai

Turkish

Turkmen

Uyghur

Ukrainian

Urdu

Uzbek

Vietnamese

Welsh

Xhosa

Yiddish

Yoruba

Zulu

EN

[hCaptcha logo, opens new window with more information](https://www.hcaptcha.com/what-is-hcaptcha-about?ref=b.stripecdn.com&utm_campaign=5034f7f0-a742-48aa-89e2-062ece60f0d6&utm_medium=challenge&hl=en "hCaptcha logo, opens new window with more information")

Please try again. ⚠️

Verify

[Skip to content](https://docs.stripe.com/payments/checkout#main-content)

Overview

[Create account](https://dashboard.stripe.com/register) or [Sign in](https://dashboard.stripe.com/login?redirect=https%3A%2F%2Fdocs.stripe.com%2Fpayments%2Fcheckout)

[The Stripe Docs logo](https://docs.stripe.com/)

Search

`/`Ask AI

[Create account](https://dashboard.stripe.com/register) [Sign in](https://dashboard.stripe.com/login?redirect=https%3A%2F%2Fdocs.stripe.com%2Fpayments%2Fcheckout)

[Get started](https://docs.stripe.com/get-started)

[Payments](https://docs.stripe.com/payments)

[Revenue](https://docs.stripe.com/revenue)

[Platforms and marketplaces](https://docs.stripe.com/connect)

[Money management](https://docs.stripe.com/money-management)

[Developer resources](https://docs.stripe.com/development)

APIs & SDKsHelp

[Overview](https://docs.stripe.com/payments)

About Stripe payments

[Upgrade your integration](https://docs.stripe.com/payments/upgrades)

Payments analytics

Online payments

[Overview](https://docs.stripe.com/payments/online-payments) [Find your use case](https://docs.stripe.com/payments/use-cases/get-started) [Use Managed Payments](https://docs.stripe.com/payments/managed-payments)

Use Payment Links

Use a prebuilt checkout page

Overview

Quickstart guides

[How Checkout works](https://docs.stripe.com/payments/checkout/how-checkout-works)

[Customize look and feel](https://docs.stripe.com/payments/checkout/customization)

[Collect additional information](https://docs.stripe.com/payments/checkout/collect-additional-info)

[Collect taxes](https://docs.stripe.com/payments/checkout/taxes)

[Dynamically update checkout](https://docs.stripe.com/payments/checkout/dynamic-updates)

[Manage your product catalog](https://docs.stripe.com/payments/checkout/product-catalog)

[Subscriptions](https://docs.stripe.com/payments/subscriptions)

[Manage payment methods](https://docs.stripe.com/payments/checkout/payment-methods)

[Let customers pay in their local currency](https://docs.stripe.com/payments/checkout/localize-prices)

[Add discounts, upsells, and optional items](https://docs.stripe.com/payments/checkout/promotions)

[Set up future payments](https://docs.stripe.com/payments/checkout/save-and-reuse)

[Save payment details during payment](https://docs.stripe.com/payments/checkout/save-during-payment)

[After the payment](https://docs.stripe.com/payments/checkout/after-the-payment)

[Migrate from legacy Checkout](https://docs.stripe.com/payments/checkout/migration)

[Migrate Checkout to use Prices](https://docs.stripe.com/payments/checkout/migrating-prices)

Build a custom integration with Elements

Build an in-app integration

In-person payments

Terminal

Payment methods

Add payment methods

Manage payment methods

Faster checkout with Link

Payment scenarios

Handle multiple currencies

Custom payment flows

Flexible acquiring

Orchestration

Beyond payments

Incorporate your company

Crypto

Agentic commerce

Financial Connections

Climate

Understand fraud

Radar fraud protection

Manage disputes

Verify identities

United States

English (United States)

[Home](https://docs.stripe.com/ "Home")[Payments](https://docs.stripe.com/payments "Payments")Use a prebuilt checkout page

# Use a prebuilt Stripe-hosted paymentpage

[Checkout](https://stripe.com/payments/checkout) is a low-code, prebuilt payment page that Stripe hosts or that you can embed into your website. Checkout uses the [Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions).

[CHECKOUT](https://docs.stripe.com/payments/checkout)

Create a payments form to accept payments on your website

Accept one-time and subscription payments from more than 40 local payment methods.

[Start building your checkout integration](https://docs.stripe.com/checkout/quickstart)

![](https://b.stripecdn.com/docs-statics-srv/assets/checkout-card-brand-choice-full-page.9cf891dfb55abcdc9ae9046ea15bc054.png)

## Payment UIs

You can use two different payment UIs with the [Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions). The following images highlight which aspects of the checkout UI Stripe hosts in each option. You can also see these options by [exploring our demo](https://checkout.stripe.dev/).

![Hosted checkout form](https://b.stripecdn.com/docs-statics-srv/assets/checkout-hosted-hover.4f0ec46833037b6fd0f1a62d9fcf7053.png)

[Stripe-hosted page](https://docs.stripe.com/checkout/quickstart) Customers enter their payment details in a Stripe-hosted payment page, then return to your site after payment completion.

![Embedded Checkout form](https://b.stripecdn.com/docs-statics-srv/assets/checkout-embedded-hover.19e99126cb27ab25f704d7357f672e1f.png)

[Embedded form](https://docs.stripe.com/checkout/embedded/quickstart) Customers enter their payment details in an embedded payment form on your site without redirection.

|  | [STRIPE-HOSTED PAGE](https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=stripe-hosted) | [EMBEDDED FORM](https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=embedded-form) |
| --- | --- | --- |
| **UI** | [Checkout](https://docs.stripe.com/payments/checkout/how-checkout-works?payment-ui=stripe-hosted) | [Checkout](https://docs.stripe.com/payments/checkout/how-checkout-works?payment-ui=embedded-form) |
| **API** | [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions) | [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions) |
| **Integration effort** | Low code | Low code |
| **Hosting** | Stripe-hosted page(optional [custom domains](https://docs.stripe.com/payments/checkout/custom-domains)) | Embed on your site |
| **UI customization** | Limited customization1 | Limited customization1 |

1Limited customization provides [20 preset fonts](https://docs.stripe.com/payments/checkout/customization/appearance#font-compatibility), 3 preset border radius options, logo and background customization, and custom button color.

## Customize checkout

[Customize the look and feel\\
\\
Customize the appearance and behavior of the checkout flow.](https://docs.stripe.com/payments/checkout/customization "Customize the look and feel")

[Collect additional information\\
\\
Collect shipping details and other customer information during checkout.](https://docs.stripe.com/payments/checkout/collect-additional-info "Collect additional information")

[Collect taxes\\
\\
Collect taxes for one-time payments in Stripe Checkout.](https://docs.stripe.com/payments/checkout/taxes "Collect taxes")

[Dynamically update checkout\\
\\
Make updates while your customer checks out.](https://docs.stripe.com/payments/checkout/dynamic-updates "Dynamically update checkout")

[Add trials, discounts, and upsells\\
\\
Add promotions, such as trials, discounts, and optional items.](https://docs.stripe.com/payments/checkout/promotions "Add trials, discounts, and upsells")

## Change when and how you collect payment

[Set up subscriptions\\
\\
Create a subscription with recurring payments for your customers.](https://docs.stripe.com/payments/subscriptions "Set up subscriptions")

[Set up future payments\\
\\
Save your customers’ payment details to charge them later.](https://docs.stripe.com/payments/checkout/save-and-reuse "Set up future payments")

[Save payment details during payment\\
\\
Accept a payment and save your customer’s payment details for future purchases.](https://docs.stripe.com/payments/checkout/save-during-payment "Save payment details during payment")

[Let customers pay in their local currency\\
\\
Use Adaptive Pricing to allow customers to pay in their local currency.](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing "Let customers pay in their local currency")

## Manage your business

[Manage your product catalog\\
\\
Handle your inventory and fulfillment with Checkout.](https://docs.stripe.com/payments/checkout/product-catalog "Manage your product catalog")

[Migrate payment methods to the Dashboard\\
\\
Migrate the management of your payment methods to the Dashboard.](https://docs.stripe.com/payments/dashboard-payment-methods "Migrate payment methods to the Dashboard")

[After the payment\\
\\
Customize the post-payment checkout process.](https://docs.stripe.com/payments/checkout/after-the-payment "After the payment")

## Sample projects

[One-time payments\\
\\
Web · Mobile web](https://github.com/stripe-samples/checkout-one-time-payments "One-time payments")

[Subscriptions\\
\\
Web · Mobile web · Stripe Billing](https://github.com/stripe-samples/checkout-single-subscription "Subscriptions")

[Browse our samples](https://docs.stripe.com/samples)