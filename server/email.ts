import { Resend } from 'resend';
import { log } from './index';

const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender - for production, update with your verified domain
const FROM_EMAIL = 'BG Remover Portal <onboarding@resend.dev>';

export async function sendOTPEmail(email: string, otp: string, fullName: string): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your Login Code - BG Remover Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px 0;">Login Code</h1>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 24px 0;">Hello ${fullName},</p>
            <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #18181b;">${otp}</span>
            </div>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 8px 0;">This code expires in 10 minutes.</p>
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">If you did not request this code, please ignore this email.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      log(`Failed to send OTP email: ${error.message}`, 'email');
      return false;
    }

    log(`OTP email sent to ${email} (ID: ${data?.id})`, 'email');
    return true;
  } catch (error: any) {
    log(`Error sending OTP email: ${error.message}`, 'email');
    return false;
  }
}

export async function sendEditedImageNotification(
  email: string, 
  fullName: string, 
  originalFileName: string
): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your Image is Ready! - BG Remover Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px 0;">Your Image is Ready!</h1>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 24px 0;">Hello ${fullName},</p>
            <p style="color: #3f3f46; font-size: 14px; margin: 0 0 16px 0;">
              Great news! The background has been removed from your image:
            </p>
            <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <span style="font-size: 14px; color: #18181b; font-weight: 500;">${originalFileName}</span>
            </div>
            <p style="color: #3f3f46; font-size: 14px; margin: 0 0 24px 0;">
              Log in to your account to download the edited image.
            </p>
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Thank you for using BG Remover Portal!</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      log(`Failed to send notification email: ${error.message}`, 'email');
      return false;
    }

    log(`Notification email sent to ${email} (ID: ${data?.id})`, 'email');
    return true;
  } catch (error: any) {
    log(`Error sending notification email: ${error.message}`, 'email');
    return false;
  }
}
