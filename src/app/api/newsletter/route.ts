import { NextRequest, NextResponse } from 'next/server'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function addToResend(email: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    return { ok: false, error: 'not_configured' }
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  try {
    await resend.contacts.create({
      email,
      audienceId,
    })
    return { ok: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Resend error'
    console.error('Resend error:', message)
    return { ok: false, error: message }
  }
}

async function sendWelcomeEmail(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const unsubUrl = `https://hackwire.news/unsubscribe?email=${encodeURIComponent(email)}`

  try {
    await resend.emails.send({
      from: 'HackWire <newsletter@hackwire.news>',
      to: email,
      subject: 'Welcome to HackWire — You\'re In',
      headers: {
        'List-Unsubscribe': `<https://hackwire.news/api/unsubscribe?email=${encodeURIComponent(email)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0A0A0F;color:#e2e8f0;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="border-bottom:2px solid #00FF88;padding-bottom:20px;margin-bottom:32px;">
      <h1 style="margin:0;font-size:28px;font-family:'JetBrains Mono',monospace;color:#00FF88;">HACKWIRE_</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Cybersecurity News, Decoded</p>
    </div>

    <h2 style="margin:0 0 16px;font-size:22px;color:#ffffff;">You're on the wire.</h2>

    <p style="font-size:15px;line-height:1.7;color:#cbd5e1;">
      Welcome to HackWire — your daily briefing on the threats, vulnerabilities, and developments shaping cybersecurity.
    </p>

    <p style="font-size:15px;line-height:1.7;color:#cbd5e1;">
      Here's what you'll get:
    </p>

    <div style="background:#0F0F1A;border:1px solid #1E1E2E;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 12px;font-size:14px;color:#e2e8f0;">
        <span style="color:#FF3B3B;">&#9679;</span>&nbsp; <strong>Breach alerts</strong> — who got hit and what was exposed
      </p>
      <p style="margin:0 0 12px;font-size:14px;color:#e2e8f0;">
        <span style="color:#F59E0B;">&#9679;</span>&nbsp; <strong>Vulnerability intel</strong> — CVEs that matter, decoded
      </p>
      <p style="margin:0 0 12px;font-size:14px;color:#e2e8f0;">
        <span style="color:#A855F7;">&#9679;</span>&nbsp; <strong>Malware &amp; ransomware</strong> — campaigns and tactics
      </p>
      <p style="margin:0 0 12px;font-size:14px;color:#e2e8f0;">
        <span style="color:#3B82F6;">&#9679;</span>&nbsp; <strong>Policy updates</strong> — regulation and compliance shifts
      </p>
      <p style="margin:0;font-size:14px;color:#e2e8f0;">
        <span style="color:#22C55E;">&#9679;</span>&nbsp; <strong>Tools &amp; research</strong> — what defenders are building
      </p>
    </div>

    <p style="font-size:15px;line-height:1.7;color:#cbd5e1;">
      Expect a daily digest every morning with the top stories — no spam, just signal.
    </p>

    <div style="margin:32px 0;">
      <a href="https://hackwire.news" style="display:inline-block;background:#00FF88;color:#0A0A0F;font-weight:700;font-size:14px;padding:12px 28px;border-radius:6px;text-decoration:none;font-family:'JetBrains Mono',monospace;">READ LATEST &rarr;</a>
    </div>

    <div style="border-top:1px solid #1E1E2E;padding-top:20px;margin-top:40px;">
      <p style="margin:0;font-size:12px;color:#475569;">
        HackWire — <a href="https://hackwire.news" style="color:#00FF88;text-decoration:none;">hackwire.news</a><br>
        You received this because you subscribed.<br>
        <a href="${unsubUrl}" style="color:#475569;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    })
  } catch (err) {
    console.error('Welcome email error:', err instanceof Error ? err.message : err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const trimmed = email.trim().toLowerCase()

    if (!isValidEmail(trimmed)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const result = await addToResend(trimmed)

    if (result.error === 'not_configured') {
      console.log('Newsletter signup (no Resend configured):', trimmed)
      return NextResponse.json({ message: "You're in. Watch your inbox." })
    }

    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to subscribe. Try again later.' }, { status: 500 })
    }

    // Send welcome email (fire and forget — don't block the response)
    sendWelcomeEmail(trimmed)

    return NextResponse.json({ message: "You're in. Watch your inbox." })
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
