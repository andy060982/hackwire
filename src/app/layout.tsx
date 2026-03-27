import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.hackwire.news'),
  title: {
    default: 'HackWire — Cybersecurity News, Decoded',
    template: '%s | HackWire',
  },
  description:
    'HackWire delivers real-time cybersecurity news covering breaches, vulnerabilities, malware, ransomware, policy, and security tools — decoded for professionals.',
  keywords: ['cybersecurity news', 'data breaches', 'vulnerabilities', 'malware', 'ransomware', 'infosec'],
  authors: [{ name: 'HackWire Editorial' }],
  alternates: {
    canonical: './',
  },
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('hackwire-theme');if(s==='light'){document.documentElement.classList.remove('dark')}else if(s==='dark'){document.documentElement.classList.add('dark')}else{var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;if(prefersDark){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#0A0A0F] text-slate-800 dark:text-gray-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
        <Analytics />
        {/* Defer third-party scripts to after page load */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0211704144731556"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZE00TMSWQF"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-ZE00TMSWQF');`}
        </Script>
      </body>
    </html>
  )
}
