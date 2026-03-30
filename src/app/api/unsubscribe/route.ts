import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_AUDIENCE_ID

  if (!apiKey || !audienceId) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    // Find the contact by email
    const contacts = await resend.contacts.list({ audienceId })
    const contact = contacts.data?.data?.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    )

    if (contact) {
      await resend.contacts.remove({ audienceId, id: contact.id })
    }

    return NextResponse.json({ message: 'Unsubscribed successfully.' })
  } catch {
    return NextResponse.json({ error: 'Failed to unsubscribe.' }, { status: 500 })
  }
}

// Support GET for one-click unsubscribe (List-Unsubscribe header)
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.redirect(new URL(`/unsubscribe?email=${encodeURIComponent(email)}`, request.url))
}
