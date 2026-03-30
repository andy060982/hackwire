export default function OfflinePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-3xl font-black font-mono text-gray-900 dark:text-white mb-4">
        You&apos;re Offline
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        No network connection detected. Previously viewed articles are still available from cache.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-[#059669] dark:bg-[#00FF88] text-white dark:text-black font-mono font-bold rounded-lg hover:opacity-90 transition-opacity"
      >
        Try Again
      </a>
    </main>
  )
}
