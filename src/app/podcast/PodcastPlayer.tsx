"use client"

import AudioPlayer from '@/components/AudioPlayer'

export default function PodcastPlayer({ src, title }: { src: string; title: string }) {
  return <AudioPlayer src={src} title={title} />
}
