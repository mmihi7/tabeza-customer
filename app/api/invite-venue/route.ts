/**
 * POST /api/invite-venue
 * Customer invites a venue to join Tabeza.
 * Sends an email to the venue owner pointing to tabeza.co.ke/signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { venueName, venueEmail, customerName } = await request.json();

    if (!venueName || !venueEmail) {
      return NextResponse.json(
        { error: 'venueName and venueEmail are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(venueEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const inviterName = customerName || 'One of your regulars';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your venue has been nominated for Tabeza</title>
</head>
<body style="margin:0;padding:0;background-color:#0C0907;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C0907;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="https://app.tabeza.co.ke/logo.png" alt="Tabeza" width="48" height="48" style="display:block;border-radius:12px;" onerror="this.style.display='none'" />
              <p style="margin:8px 0 0;color:#C8861A;font-size:20px;font-weight:700;letter-spacing:0.05em;">TABEZA</p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#131009;border:1px solid rgba(200,134,26,0.18);border-radius:16px;padding:40px 36px;">

              <h1 style="margin:0 0 8px;color:#F0E8D8;font-size:24px;font-weight:600;line-height:1.3;">
                Your guests want you on Tabeza
              </h1>
              <p style="margin:0 0 16px;color:#7A6A54;font-size:15px;line-height:1.6;">
                <strong style="color:#C8861A;">${inviterName}</strong> nominated <strong style="color:#F0E8D8;">${venueName}</strong> to join Tabeza — Kenya's digital tab management platform.
              </p>
              <p style="margin:0 0 24px;color:#7A6A54;font-size:15px;line-height:1.6;">
                Tabeza lets your guests open digital tabs, order from their phones, pay via M-Pesa, and earn loyalty rewards — all without paper or manual reconciliation.
              </p>

              <a href="https://tabeza.co.ke"
                 style="display:inline-block;background-color:#C8861A;color:#0C0907;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;letter-spacing:0.02em;">
                Learn more at tabeza.co.ke →
              </a>

              <p style="margin:24px 0 0;color:#5A4A38;font-size:13px;line-height:1.6;">
                Questions? Email us at <a href="mailto:support@tabeza.co.ke" style="color:#C8861A;text-decoration:none;">support@tabeza.co.ke</a>
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;color:#5A4A38;font-size:12px;">
                © Tabeza · <a href="https://tabeza.co.ke" style="color:#C8861A;text-decoration:none;">tabeza.co.ke</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: 'Tabeza <support@tabeza.co.ke>',
      to: venueEmail,
      subject: `${inviterName} wants ${venueName} on Tabeza`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[invite-venue]', err);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }
}
