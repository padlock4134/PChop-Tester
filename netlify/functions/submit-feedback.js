const nodemailer = require('nodemailer');
const { createErrorResponse, createOkResponseWithBody } = require('./lib/http-utils');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const categoryLabels = {
  general: '💬 General Feedback',
  bug: '🐛 Bug Report',
  feature: '✨ Feature Request',
  content: '📚 Content Issue'
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    const { category = 'general', message = '', submitterEmail = 'Unknown', schoolName = 'Unknown School' } = JSON.parse(event.body || '{}');

    if (!message.trim()) {
      return createErrorResponse(400, 'Feedback message is required');
    }

    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const categoryLabel = categoryLabels[category] || category;

    const emailSubject = `[PorkChop Feedback] ${categoryLabel} from ${schoolName}`;
    const emailText = `
New feedback submitted via the PorkChop Admin Dashboard.

Time: ${formattedDate}
Category: ${categoryLabel}
School: ${schoolName}
Submitted By: ${submitterEmail}

Message:
${message}

---
This is an automated notification from PorkChop Admin Dashboard.
    `.trim();

    if (!process.env.EMAIL_FROM) {
      console.error('Missing required env var: EMAIL_FROM');
      return createErrorResponse(500, 'Email notification not configured');
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'patrickr@porkchopd.com',
      subject: emailSubject,
      text: emailText
    });

    return createOkResponseWithBody(JSON.stringify({
      success: true,
      message: 'Feedback submitted successfully'
    }), [], true);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return createErrorResponse(500, `Unexpected error: ${error.message}`);
  }
};
