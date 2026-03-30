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
      // Resend not set up — accept the signup and log it server-side
      console.log('Newsletter signup (no Resend configured):', trimmed)
      return NextResponse.json({ message: "You're in. Watch your inbox." })
    }

    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to subscribe. Try again later.' }, { status: 500 })
    }

    return NextResponse.json({ message: "You're in. Watch your inbox." })
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
