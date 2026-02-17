import { NextResponse } from 'next/server'
import { sendStatusUpdateEmail } from '@/lib/mail'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('to') || 'test@example.com'

    console.log('[TestRoute] Triggering test email to:', email)

    const result = await sendStatusUpdateEmail({
        to: email,
        subject: 'CivicResolve: Test Notification System',
        title: 'Repair of Broken Streetlight',
        description: 'This is a test complaint description to verify the new Nodemailer integration and template rendering.',
        status: 'RESOLVED',
        remarks: 'The lighting fixtures have been replaced and verified by the ward maintenance team.'
    })

    if (result.success) {
        return NextResponse.json({
            message: 'Test email sequence initiated.',
            mode: result.id ? 'SMTP' : 'DUMMY (Check terminal)',
            id: result.id
        })
    } else {
        return NextResponse.json({
            error: 'Mail delivery failed',
            details: result.error
        }, { status: 500 })
    }
}
