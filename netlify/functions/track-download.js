const nodemailer = require('nodemailer');
const { createErrorResponse, createOkResponseWithBody } = require('./lib/http-utils');

// Configure email transporter
const createTransporter = () => {
  // You'll need to set these environment variables in your Netlify dashboard
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

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    // Parse the request body
    const { visitorInfo = {} } = JSON.parse(event.body || '{}');
    
    // Get current date and time
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Prepare email content
    const emailSubject = 'PorkChop Pitch Deck Downloaded';
    const emailText = `
      Someone downloaded the PorkChop pitch deck!
      
      Time: ${formattedDate}
      
      Visitor Information:
      IP: ${visitorInfo.ip || 'Not available'}
      User Agent: ${visitorInfo.userAgent || 'Not available'}
      Referrer: ${visitorInfo.referrer || 'Not available'}
      
      This is an automated notification from your PorkChop investment page.
    `;

    // Create email transporter
    const transporter = createTransporter();

    // Send email notification
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'notifications@porkchop.app',
      to: process.env.NOTIFICATION_EMAIL || 'chef@porkchop.app',
      subject: emailSubject,
      text: emailText
    });

    return createOkResponseWithBody(JSON.stringify({ 
      success: true,
      message: 'Download tracked successfully'
    }), [], true);
  } catch (error) {
    console.error('Error tracking download:', error);
    return createErrorResponse(500, `Unexpected error: ${error.message}`);
  }
};
