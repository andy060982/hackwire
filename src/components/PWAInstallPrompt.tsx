'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Don't show if user dismissed before (check for 7-day cooldown)
    const dismissed = localStorage.getItem('hackwire-pwa-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    // Detect iOS
    const ua = navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      // Show iOS-specific banner after 30s
      const timer = setTimeout(() => setShowBanner(true), 30000)
      return () => clearTimeout(timer)
    }

    // Android/Desktop — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show banner after 15s of browsing
      setTimeout(() => setShowBanner(true), 15000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIOSGuide(false)
    localStorage.setItem('hackwire-pwa-dismissed', Date.now().toString())
  }

  if (!showBanner) return null

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 shadow-2xl shadow-black/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0A0A0F] border border-[#1E1E2E] flex items-center justify-center flex-shrink-0">
              <span className="font-mono font-black text-sm">
                <span className="text-[#00FF88]">H</span>
                <span className="text-white">W</span>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-mono font-bold text-sm">
                Install HackWire
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Get instant access to breaking cybersecurity news. Works offline.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-300 text-lg leading-none p-1"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            {isIOS ? (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex-1 px-4 py-2 bg-[#00FF88] text-black font-mono font-bold text-xs rounded-lg hover:bg-[#00DD77] transition-colors"
              >
                Show Me How
              </button>
            ) : (
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 bg-[#00FF88] text-black font-mono font-bold text-xs rounded-lg hover:bg-[#00DD77] transition-colors"
              >
                Install App
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-4 py-2 border border-[#1E1E2E] text-gray-400 font-mono text-xs rounded-lg hover:border-gray-600 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-white font-mono font-bold text-lg mb-4">Install HackWire</h3>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="text-[#00FF88] font-mono font-bold">1.</span>
                <span>Tap the <strong className="text-white">Share</strong> button <span className="text-lg">&#xFEFF;&#x2B06;&#xFE0E;</span> in Safari&apos;s toolbar</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#00FF88] font-mono font-bold">2.</span>
                <span>Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#00FF88] font-mono font-bold">3.</span>
                <span>Tap <strong className="text-white">&quot;Add&quot;</strong> in the top right</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-5 px-4 py-2.5 bg-[#00FF88] text-black font-mono font-bold text-sm rounded-lg hover:bg-[#00DD77] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  )
}
