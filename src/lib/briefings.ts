import rawBriefings from './briefings-data.json'

export interface Briefing {
  date: string
  slug: string
  title: string
  subtitle: string
  summary: string
  body: string
  articleCount: number
  publishedAt: string
  articleSlugs: string[]
}

export const briefings: Briefing[] = rawBriefings as Briefing[]

export function getBriefingByDate(date: string): Briefing | undefined {
  return briefings.find((b) => b.date === date)
}

export function getBriefingBySlug(slug: string): Briefing | undefined {
  return briefings.find((b) => b.slug === slug)
}

export function getLatestBriefing(): Briefing | undefined {
  return briefings[0]
}

export function getAllBriefings(): Briefing[] {
  return [...briefings].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}
