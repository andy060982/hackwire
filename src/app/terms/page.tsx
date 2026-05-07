import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for HackWire — cybersecurity news, decoded.',
  alternates: { canonical: 'https://www.hackwire.news/terms' },
  openGraph: {
    title: 'HackWire Terms of Service',
    url: 'https://www.hackwire.news/terms',
  },
}

const LAST_UPDATED = 'May 7, 2026'

export default function TermsPage() {
  return (
    <main className="container-custom max-w-3xl mx-auto px-4 py-16 prose prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-sm text-zinc-400">Last updated: {LAST_UPDATED}</p>

      <h2>1. Acceptance</h2>
      <p>
        By accessing or using HackWire (the &ldquo;Site&rdquo;), available at <Link href="/">hackwire.news</Link>,
        you agree to be bound by these Terms of Service. If you do not agree, do not use the Site.
      </p>

      <h2>2. Service Description</h2>
      <p>
        HackWire publishes cybersecurity news synthesized from public sources, original analysis, and editorial commentary.
        Some content may be made available behind a free or paid subscription. Subscriptions, when offered, are
        sold and processed by Google through Google Reader Revenue Manager; subscription transactions are governed
        by Google&apos;s terms in addition to these Terms.
      </p>

      <h2>3. Editorial Use</h2>
      <p>
        Articles on HackWire reference public reporting from third parties. Brand names, logos, and trademarks of those
        third parties belong to their respective owners. HackWire&apos;s coverage is editorial commentary and qualifies
        as fair use under United States copyright law.
      </p>

      <h2>4. User Conduct</h2>
      <p>
        You agree not to: (a) attempt to disrupt or compromise the Site; (b) scrape, mass-download, or republish
        content without written permission; (c) impersonate HackWire or its editorial staff; or (d) use the Site
        in violation of applicable law.
      </p>

      <h2>5. Intellectual Property</h2>
      <p>
        Original HackWire editorial content, layouts, branding, and code are the property of HackWire and protected
        by copyright. The HackWire name and logo are trademarks of HackWire. Permission to reproduce more than brief
        excerpts requires written consent.
      </p>

      <h2>6. Disclaimers</h2>
      <p>
        HackWire is provided &ldquo;as is.&rdquo; We make no warranties about accuracy, completeness, or fitness for a
        particular purpose. Cybersecurity advisories and recommendations are general information, not professional
        advice. Verify with vendors and qualified professionals before acting.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, HackWire and its operators are not liable for any indirect,
        incidental, special, or consequential damages arising from your use of the Site or reliance on its content.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes will be reflected by updating the &ldquo;Last
        updated&rdquo; date above. Continued use of the Site after changes constitutes acceptance.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions: <a href="mailto:editorial@hackwire.news">editorial@hackwire.news</a>
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Florida, USA, without regard to conflict of laws
        principles. Disputes will be resolved in the state or federal courts located in Orange County, Florida.
      </p>

      <p className="mt-12 text-sm">
        <Link href="/privacy">Privacy Policy</Link> &middot; <Link href="/">Home</Link>
      </p>
    </main>
  )
}
