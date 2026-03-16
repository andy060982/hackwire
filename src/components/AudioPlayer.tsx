"use client"

import { useState, useRef } from 'react'

export default function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [duration, setDuration] = useState('0:00')

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const onTimeUpdate = () => {
    if (!audioRef.current) return
    const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100
    setProgress(pct)
    setCurrentTime(fmt(audioRef.current.currentTime))
  }

  const onLoaded = () => {
    if (!audioRef.current) return
    setDuration(fmt(audioRef.current.duration))
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = pct * audioRef.current.duration
  }

  return (
    <div className="bg-gray-100 dark:bg-[#1E1E2E] rounded-lg p-4 border border-gray-200 dark:border-[#2A2A3E]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoaded}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#059669] dark:bg-[#00FF88] text-white dark:text-black hover:opacity-80 transition-opacity flex-shrink-0"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-medium text-gray-800 dark:text-gray-200 truncate">{title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-10">{currentTime}</span>
            <div
              className="flex-1 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full cursor-pointer"
              onClick={seek}
            >
              <div
                className="h-full bg-[#059669] dark:bg-[#00FF88] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-10 text-right">{duration}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
