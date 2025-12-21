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

/**
 * Escape HTML special characters to prevent XSS attacks
 */
const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Sanitize email subject line to prevent header injection attacks
 * Removes newlines, carriage returns, and other control characters
 */
const sanitizeEmailSubject = (subject: string): string => {
  return subject
    .replace(/[\r\n]/g, ' ') // Replace newlines and carriage returns with spaces
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .substring(0, 200); // Limit length to prevent abuse
};

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
    <title>SplitBi Invitation</title>
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
            <div class="logo">SplitBi</div>
            <div class="tagline">Splitting expenses, made easy</div>
        </div>
        
        <div class="content">
            <h1 class="invitation-title">You're Invited! 🎉</h1>
            
            <p class="invitation-text">
                <strong>${data.inviterName}</strong> has invited you to join their expense group on SplitBi. 
                Start tracking and splitting shared expenses together!
            </p>
            
            <div class="group-info">
                <div class="group-name">📊 ${data.groupName}</div>
                <div class="inviter-name">Invited by ${data.inviterName}</div>
            </div>
            
            <div style="text-align: center;">
                <a href="${data.inviteUrl}" class="cta-button">
                    Join Group on SplitBi
                </a>
            </div>
            
            <div class="divider"></div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center;">
                This invitation will expire in 7 days. If you don't have a SplitBi account yet, 
                you'll be able to create one when you click the button above.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                This email was sent by <a href="https://splitbi.app" class="footer-link">SplitBi</a>
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
SplitBi - Expense Splitting Made Easy

You're Invited! 🎉

${data.inviterName} has invited you to join their expense group "${data.groupName}" on SplitBi.

Start tracking and splitting shared expenses together!

Group: ${data.groupName}
Invited by: ${data.inviterName}

Join now: ${data.inviteUrl}

This invitation will expire in 7 days. If you don't have a SplitBi account yet, you'll be able to create one when you visit the link above.

---
This email was sent by SplitBi (https://splitbi.app)
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
      from: 'SplitBi <invites@mail.splitbi.app>',
      to: [data.invitedEmail],
      subject: `${data.inviterName} invited you to join "${data.groupName}" on SplitBi`,
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

export interface FeedbackData {
  type: 'bug' | 'feature' | 'general';
  subject: string;
  message: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Generate HTML email template for feedback
 */
const generateFeedbackEmailHTML = (data: FeedbackData): string => {
  const typeLabels = {
    bug: '🐛 Bug Report',
    feature: '💡 Feature Request',
    general: '😊 General Feedback'
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SplitBi Feedback</title>
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
        .content {
            padding: 32px 24px;
        }
        .feedback-type {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 24px;
            font-weight: 600;
            color: #111827;
        }
        .subject {
            font-size: 20px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 16px;
        }
        .message {
            font-size: 16px;
            color: #4b5563;
            line-height: 1.7;
            white-space: pre-wrap;
            background-color: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #0ea5e9;
        }
        .user-info {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SplitBi</div>
            <div style="font-size: 14px; opacity: 0.9;">New Feedback Received</div>
        </div>
        
        <div class="content">
            <div class="feedback-type">${typeLabels[data.type]}</div>
            
            <div class="subject">${escapeHtml(data.subject)}</div>
            
            <div class="message">${escapeHtml(data.message)}</div>
            
            ${data.userEmail || data.userName ? `
            <div class="user-info">
                ${data.userName ? `<strong>From:</strong> ${escapeHtml(data.userName)}<br>` : ''}
                ${data.userEmail ? `<strong>Email:</strong> ${escapeHtml(data.userEmail)}` : ''}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p class="footer-text">
                This feedback was submitted from <a href="https://splitbi.app" style="color: #0ea5e9; text-decoration: none;">SplitBi</a>
            </p>
        </div>
    </div>
</body>
</html>
  `;
};

/**
 * Sanitize plain text to prevent email format issues
 * Removes control characters but preserves newlines for message formatting
 */
const sanitizePlainText = (text: string, preserveNewlines: boolean = false): string => {
  if (preserveNewlines) {
    // For message content, preserve newlines but remove other control chars
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  // For other fields, replace newlines with spaces
  return text
    .replace(/[\r\n]/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
};

/**
 * Generate plain text email for feedback
 */
const generateFeedbackEmailText = (data: FeedbackData): string => {
  const typeLabels = {
    bug: '🐛 Bug Report',
    feature: '💡 Feature Request',
    general: '😊 General Feedback'
  };

  return `
SplitBi - Feedback Submission

${typeLabels[data.type]}

Subject: ${sanitizePlainText(data.subject)}

Message:
${sanitizePlainText(data.message, true)}

${data.userName || data.userEmail ? `
From: ${data.userName ? sanitizePlainText(data.userName) : 'Anonymous'}${data.userEmail ? ` (${sanitizePlainText(data.userEmail)})` : ''}
` : ''}

---
This feedback was submitted from SplitBi (https://splitbi.app)
  `.trim();
};

/**
 * Firebase Function to send feedback emails
 */
export const sendFeedbackEmail = functions.https.onCall(async (data: FeedbackData, context) => {
  // Validate required fields
  if (!data.type || !data.subject || !data.message) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required feedback data');
  }

  // Validate feedback type
  if (!['bug', 'feature', 'general'].includes(data.type)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid feedback type');
  }

  // Validate email format if provided
  if (data.userEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.userEmail)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
    }
  }

  try {
    // Sanitize subject to prevent header injection
    const sanitizedSubject = sanitizeEmailSubject(data.subject);
    const emailSubject = `[SplitBi ${data.type === 'bug' ? 'Bug' : data.type === 'feature' ? 'Feature' : 'Feedback'}] ${sanitizedSubject}`;
    
    const { data: emailData, error } = await resend.emails.send({
      from: 'SplitBi Support <support@mail.splitbi.app>',
      to: ['feedback@splitbi.app'],
      reply_to: data.userEmail || undefined,
      subject: emailSubject,
      html: generateFeedbackEmailHTML(data),
      text: generateFeedbackEmailText(data),
    });

    if (error) {
      console.error('Resend error:', error);
      throw new functions.https.HttpsError('internal', `Failed to send email: ${error.message}`);
    }

    console.log('Feedback email sent successfully:', emailData);
    return { success: true, messageId: emailData?.id };
  } catch (error: any) {
    console.error('Feedback email sending error:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to send feedback email');
  }
});
