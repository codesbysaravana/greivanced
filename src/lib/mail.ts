import nodemailer from 'nodemailer'

/**
 * MAILING SYSTEM CONFIGURATION
 * 
 * To use Gmail:
 * 1. Go to Google Account -> Security
 * 2. Enable 2-Factor Authentication
 * 3. Search for "App Passwords"
 * 4. Create one for "Mail" and use that as SMTP_PASS
 */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

interface MailData {
    to: string
    subject: string
    title: string
    description: string
    status: string
    remarks?: string
}

export async function sendStatusUpdateEmail({ to, subject, title, description, status, remarks }: MailData) {
    // If SMTP is not configured, we log to console and skip (prevents crashes in dev)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ [MailService] SMTP credentials not found. Skipping email delivery.')
        console.log(`[DUMMY MAIL] To: ${to} | Status: ${status} | Topic: ${title}`)
        return { success: true, dummy: true }
    }

    try {
        const info = await transporter.sendMail({
            from: `"Greivanced Support" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="background: #2563eb; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 12px; display: inline-block; font-weight: 800; font-size: 20px;">CR</div>
                        <h2 style="color: #0f172a; margin-top: 15px;">Greivanced</h2>
                    </div>
                    
                    <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 20px; text-align: center;">Grievance Status Update</h1>
                    
                    <p style="font-size: 16px; color: #475569; line-height: 1.6;">Hello,</p>
                    
                    <p style="font-size: 16px; color: #475569; line-height: 1.6;">
                        The status of your complaint <strong>"${title}"</strong> has been updated to 
                        <span style="display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 999px; font-weight: 700; font-size: 14px;">${status}</span>.
                    </p>
                    
                    <div style="background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; margin: 30px 0;">
                        <h3 style="margin-top: 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Complaint Details</h3>
                        <p style="margin-bottom: 15px; color: #334155;"><strong>Issue:</strong> ${description.substring(0, 200)}...</p>
                        ${remarks ? `
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #cbd5e1;">
                                <h3 style="margin-top: 0; color: #1e293b; font-size: 14px; text-transform: uppercase;">Official Remarks</h3>
                                <p style="color: #0f172a; font-style: italic;">"${remarks}"</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/citizen/dashboard" 
                           style="background: #0f172a; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
                            View Details in Dashboard
                        </a>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                    
                    <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
                        This is an automated system notification from the Greivanced Grievance Redressal platform.<br/>
                        Please do not reply directly to this email.
                    </p>
                </div>
            `,
        })

        console.log('[MailService] Email sent via SMTP:', info.messageId)
        return { success: true, id: info.messageId }
    } catch (e) {
        console.error('[MailService] SMTP Error:', e)
        return { success: false, error: e }
    }
}
