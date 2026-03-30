import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'HackWire — Cybersecurity News, Decoded'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0F',
          position: 'relative',
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            display: 'flex',
          }}
        />

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

        {/* Terminal bracket decoration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '12px',
          }}
        >
          <span
            style={{
              color: '#00FF88',
              fontSize: '24px',
              fontFamily: 'monospace',
              opacity: 0.5,
            }}
          >
            {'['}
          </span>
          <span
            style={{
              color: '#00FF88',
              fontSize: '14px',
              fontFamily: 'monospace',
              letterSpacing: '6px',
              textTransform: 'uppercase',
            }}
          >
            CYBERSECURITY INTELLIGENCE
          </span>
          <span
            style={{
              color: '#00FF88',
              fontSize: '24px',
              fontFamily: 'monospace',
              opacity: 0.5,
            }}
          >
            {']'}
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
          }}
        >
          <span
            style={{
              color: '#00FF88',
              fontSize: '96px',
              fontFamily: 'monospace',
              fontWeight: 800,
              letterSpacing: '-2px',
            }}
          >
            HackWire
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: '28px',
            fontFamily: 'monospace',
            marginTop: '16px',
            opacity: 0.9,
          }}
        >
          Cybersecurity News, Decoded
        </div>

        {/* Bottom decoration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginTop: '48px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '1px',
              backgroundColor: '#00FF88',
              opacity: 0.3,
              display: 'flex',
            }}
          />
          <span
            style={{
              color: '#888',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          >
            hackwire.news
          </span>
          <div
            style={{
              width: '60px',
              height: '1px',
              backgroundColor: '#00FF88',
              opacity: 0.3,
              display: 'flex',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
