import { ImageResponse } from 'next/og'
import { getArticleBySlug, articles } from '@/lib/articles'

export const runtime = 'nodejs'
export const alt = 'HackWire Article'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
  breaches: { bg: '#7f1d1d', text: '#fca5a5', label: 'Breaches' },
  vulnerabilities: { bg: '#78350f', text: '#fcd34d', label: 'Vulnerabilities' },
  malware: { bg: '#581c87', text: '#d8b4fe', label: 'Malware' },
  ransomware: { bg: '#4c0519', text: '#fda4af', label: 'Ransomware' },
  policy: { bg: '#1e3a5f', text: '#93c5fd', label: 'Policy' },
  tools: { bg: '#064e3b', text: '#6ee7b7', label: 'Tools' },
}

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0A0F',
            color: '#FFFFFF',
            fontSize: '48px',
            fontFamily: 'monospace',
          }}
        >
          Article Not Found
        </div>
      ),
      { ...size }
    )
  }

  const cat = categoryColors[article.category] || categoryColors.tools
  const headline =
    article.headline.length > 120
      ? article.headline.slice(0, 117) + '...'
      : article.headline

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0A0A0F',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #00FF88, transparent)',
            display: 'flex',
          }}
        />

        {/* Subtle grid background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(rgba(0,255,136,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />

        {/* Header row: logo + category */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
          }}
        >
          {/* HackWire branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                color: '#00FF88',
                fontSize: '32px',
                fontFamily: 'monospace',
                fontWeight: 800,
              }}
            >
              HackWire
            </span>
            <span
              style={{
                color: '#666',
                fontSize: '16px',
                fontFamily: 'monospace',
              }}
            >
              hackwire.news
            </span>
          </div>

          {/* Category badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: cat.bg,
              color: cat.text,
              fontSize: '16px',
              fontFamily: 'monospace',
              fontWeight: 600,
              padding: '8px 20px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {cat.label}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: headline.length > 80 ? '42px' : '52px',
              fontFamily: 'monospace',
              fontWeight: 700,
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {headline}
          </h1>
        </div>

        {/* Footer row: source + severity */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(0,255,136,0.15)',
            paddingTop: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span
              style={{
                color: '#00FF88',
                fontSize: '14px',
                fontFamily: 'monospace',
                opacity: 0.7,
              }}
            >
              {article.source}
            </span>
            <span
              style={{
                color: '#444',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            >
              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {article.severity && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  color: article.severity === 'critical' ? '#ef4444' : article.severity === 'high' ? '#f97316' : '#eab308',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {article.severity} severity
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  )
}
