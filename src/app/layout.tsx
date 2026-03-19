import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
// Analytics loaded via script tag to avoid hydration issues

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('hackwire-theme');if(s==='light'){document.documentElement.classList.remove('dark')}else if(s==='dark'){document.documentElement.classList.add('dark')}else{var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;if(prefersDark){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#0A0A0F] text-slate-800 dark:text-gray-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
        <script defer src="https://va.vercel-scripts.com/v1/script.js" data-endpoint="/_vercel/insights" />
      </body>
    </html>
  )
}
