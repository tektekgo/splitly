import * as functions from 'firebase-functions';
import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
// Priority: Environment variable > Firebase config (deprecated)
const apiKey = process.env.RESEND_API_KEY || functions.config().resend?.api_key;
console.log('API Key loaded:', apiKey ? 'Yes' : 'No');
console.log('API Key length:', apiKey ? apiKey.length : 0);
console.log('API Key prefix:', apiKey ? apiKey.substring(0, 8) + '...' : 'None');

if (!apiKey) {
  throw new Error('Resend API key is not configured. Please set RESEND_API_KEY environment variable or configure via Firebase config.');
}

const resend = new Resend(apiKey);

export interface EmailInviteData {
  invitedEmail: string;
  inviterName: string;
  groupName: string;
  inviteUrl: string;
}

/**
 * Generate HTML email template for group invites
 */
const generateInviteEmailHTML = (data: EmailInviteData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Splitbi Invitation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .tagline {
            font-size: 14px;
            opacity: 0.9;
            font-weight: 500;
        }
        .content {
            padding: 32px 24px;
        }
        .invitation-title {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 16px;
            text-align: center;
        }
        .invitation-text {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 24px;
            line-height: 1.7;
        }
        .group-info {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            border-left: 4px solid #0ea5e9;
        }
        .group-name {
            font-size: 18px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 8px;
        }
        .inviter-name {
            font-size: 14px;
            color: #6b7280;
        }
        .cta-button {
            display: inline-block;
            background-color: #0ea5e9;
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 24px 0;
            transition: background-color 0.2s;
        }
        .cta-button:hover {
            background-color: #0284c7;
        }
        .footer {
            background-color: #f9fafb;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-text {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        .footer-link {
            color: #0ea5e9;
            text-decoration: none;
            font-weight: 500;
        }
        .footer-link:hover {
            text-decoration: underline;
        }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 24px 0;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .header, .content, .footer {
                padding: 20px 16px;
            }
            .invitation-title {
                font-size: 20px;
            }
            .cta-button {
                display: block;
                width: 100%;
                box-sizing: border-box;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Splitbi</div>
            <div class="tagline">Splitting expenses, made easy</div>
        </div>
        
        <div class="content">
            <h1 class="invitation-title">You're Invited! 🎉</h1>
            
            <p class="invitation-text">
                <strong>${data.inviterName}</strong> has invited you to join their expense group on Splitbi. 
                Start tracking and splitting shared expenses together!
            </p>
            
            <div class="group-info">
                <div class="group-name">📊 ${data.groupName}</div>
                <div class="inviter-name">Invited by ${data.inviterName}</div>
            </div>
            
            <div style="text-align: center;">
                <a href="${data.inviteUrl}" class="cta-button">
                    Join Group on Splitbi
                </a>
            </div>
            
            <div class="divider"></div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center;">
                This invitation will expire in 7 days. If you don't have a Splitbi account yet, 
                you'll be able to create one when you click the button above.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                This email was sent by <a href="https://splitbi.app" class="footer-link">Splitbi</a>
            </p>
            <p class="footer-text">
                If you didn't expect this invitation, you can safely ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

/**
 * Generate plain text email for group invites
 */
const generateInviteEmailText = (data: EmailInviteData): string => {
  return `
Splitbi - Expense Splitting Made Easy

You're Invited! 🎉

${data.inviterName} has invited you to join their expense group "${data.groupName}" on Splitbi.

Start tracking and splitting shared expenses together!

Group: ${data.groupName}
Invited by: ${data.inviterName}

Join now: ${data.inviteUrl}

This invitation will expire in 7 days. If you don't have a Splitbi account yet, you'll be able to create one when you visit the link above.

---
This email was sent by Splitbi (https://splitbi.app)
If you didn't expect this invitation, you can safely ignore this email.
  `.trim();
};

/**
 * Firebase Function to send group invitation emails
 */
export const sendGroupInviteEmail = functions.https.onCall(async (data: EmailInviteData, context) => {
  // Verify that the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to send invites');
  }

  // Validate required fields
  if (!data.invitedEmail || !data.inviterName || !data.groupName || !data.inviteUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required email data');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.invitedEmail)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
  }

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Splitbi <onboarding@resend.dev>',
      to: [data.invitedEmail],
      subject: `${data.inviterName} invited you to join "${data.groupName}" on Splitbi`,
      html: generateInviteEmailHTML(data),
      text: generateInviteEmailText(data),
    });

    if (error) {
      console.error('Resend error:', error);
      throw new functions.https.HttpsError('internal', `Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', emailData);
    return { success: true, messageId: emailData?.id };
  } catch (error: any) {
    console.error('Email sending error:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to send invitation email');
  }
});
