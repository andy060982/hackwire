import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  metadataBase: new URL('https://hackwire.news'),
  title: {
    default: 'HackWire — Cybersecurity News, Decoded',
    template: '%s | HackWire',
  },
  description:
    'HackWire delivers real-time cybersecurity news covering breaches, vulnerabilities, malware, ransomware, policy, and security tools — decoded for professionals.',
  keywords: ['cybersecurity news', 'data breaches', 'vulnerabilities', 'malware', 'ransomware', 'infosec'],
  authors: [{ name: 'HackWire Editorial' }],
  openGraph: {
    type: 'website',
    siteName: 'HackWire',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@hackwirenews',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0A0A0F] text-gray-100 antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
