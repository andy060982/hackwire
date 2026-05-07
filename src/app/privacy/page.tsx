import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for HackWire — cybersecurity news, decoded.',
  alternates: { canonical: 'https://www.hackwire.news/privacy' },
  openGraph: {
    title: 'HackWire Privacy Policy',
    url: 'https://www.hackwire.news/privacy',
  },
}

const LAST_UPDATED = 'May 7, 2026'

export default function PrivacyPage() {
  return (
    <main className="container-custom max-w-3xl mx-auto px-4 py-16 prose prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-zinc-400">Last updated: {LAST_UPDATED}</p>

      <h2>1. Overview</h2>
      <p>
        HackWire (&ldquo;we,&rdquo; &ldquo;us&rdquo;) operates <Link href="/">hackwire.news</Link>. This Privacy Policy
        explains what information we collect, how we use it, and your rights.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Information you provide</h3>
      <ul>
        <li>
          <strong>Newsletter / subscription:</strong> when you subscribe through the Site, your name, email address,
          and (for paid subscriptions) billing details processed by our payment partner.
        </li>
        <li>
          <strong>Contact:</strong> when you email us or contact us, the contents of your message.
        </li>
      </ul>
      <h3>2.2 Information collected automatically</h3>
      <ul>
        <li>
          <strong>Analytics:</strong> standard web analytics (page views, referrer, device type) via Vercel Analytics.
        </li>
        <li>
          <strong>Server logs:</strong> IP address, user agent, and timestamps for security and operational purposes.
        </li>
      </ul>

      <h2>3. How We Use Information</h2>
      <ul>
        <li>To deliver newsletters and subscription content you request.</li>
        <li>To improve the Site and editorial coverage.</li>
        <li>To prevent abuse and respond to security incidents.</li>
        <li>To comply with applicable legal obligations.</li>
      </ul>

      <h2>4. Subscriptions and Payments</h2>
      <p>
        Paid subscriptions are sold and processed by Google through Google Reader Revenue Manager. Google acts as
        the merchant of record. Your name and email may be shared with us by Google so we can deliver subscription
        content. Google&apos;s privacy practices are governed by the{' '}
        <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">
          Google Privacy Policy
        </a>
        .
      </p>

      <h2>5. Sharing</h2>
      <p>We do not sell personal information. We share data only:</p>
      <ul>
        <li>With service providers (analytics, payment processing, email delivery) under contract.</li>
        <li>When required by law, court order, or to protect rights and safety.</li>
        <li>In connection with a corporate transaction (merger, acquisition), with notice.</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        We use minimal cookies for site functionality and analytics. You can control cookies through your browser settings.
      </p>

      <h2>7. Data Retention</h2>
      <p>
        We keep subscriber records for as long as you have an active subscription plus a reasonable period for
        legal and accounting requirements. Anonymous analytics are retained per our analytics provider&apos;s policies.
      </p>

      <h2>8. Your Rights</h2>
      <p>
        Depending on your jurisdiction (e.g., EU/UK GDPR, California CCPA), you may have rights to access, correct,
        delete, or port your personal data, or to object to certain processing. Contact us at{' '}
        <a href="mailto:editorial@hackwire.news">editorial@hackwire.news</a> to exercise these rights.
      </p>

      <h2>9. Children</h2>
      <p>
        HackWire is not directed at children under 13. We do not knowingly collect personal information from children.
      </p>

      <h2>10. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect personal information. No method of
        transmission or storage is 100% secure.
      </p>

      <h2>11. International Users</h2>
      <p>
        HackWire is operated from the United States. By using the Site, you consent to the transfer of your
        information to the United States.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update this Privacy Policy. Material changes will be reflected by updating the &ldquo;Last updated&rdquo;
        date above.
      </p>

      <h2>13. Contact</h2>
      <p>
        Privacy questions: <a href="mailto:editorial@hackwire.news">editorial@hackwire.news</a>
      </p>

      <p className="mt-12 text-sm">
        <Link href="/terms">Terms of Service</Link> &middot; <Link href="/">Home</Link>
      </p>
    </main>
  )
}
