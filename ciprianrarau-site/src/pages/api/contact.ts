import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse form data
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const company = formData.get('company') as string;
    const message = formData.get('message') as string;

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Email configuration
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: import.meta.env.GMAIL_USER,
        pass: import.meta.env.GMAIL_APP_PASSWORD, // Gmail App Password
      },
    });

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .header {
                  background-color: #f8f9fa;
                  padding: 20px;
                  border-radius: 8px;
                  margin-bottom: 20px;
              }
              .content {
                  background-color: white;
                  padding: 20px;
                  border: 1px solid #e9ecef;
                  border-radius: 8px;
              }
              .field {
                  margin-bottom: 15px;
              }
              .label {
                  font-weight: bold;
                  color: #495057;
              }
              .value {
                  margin-top: 5px;
                  padding: 10px;
                  background-color: #f8f9fa;
                  border-radius: 4px;
              }
              .message-content {
                  white-space: pre-wrap;
                  line-height: 1.5;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h2>New Contact Form Submission</h2>
              <p>From: ciprianrarau.com</p>
          </div>
          
          <div class="content">
              <div class="field">
                  <div class="label">Name:</div>
                  <div class="value">${name}</div>
              </div>
              
              <div class="field">
                  <div class="label">Email:</div>
                  <div class="value">${email}</div>
              </div>
              
              ${company ? `
              <div class="field">
                  <div class="label">Company:</div>
                  <div class="value">${company}</div>
              </div>
              ` : ''}
              
              <div class="field">
                  <div class="label">Message:</div>
                  <div class="value message-content">${message}</div>
              </div>
          </div>
      </body>
      </html>
    `;

    // Email options
    const mailOptions = {
      from: `"Website Contact Form" <${import.meta.env.GMAIL_USER}>`,
      to: import.meta.env.RECIPIENT_EMAIL || import.meta.env.GMAIL_USER,
      subject: `New Contact: ${name}${company ? ` from ${company}` : ''}`,
      html: htmlContent,
      replyTo: email, // Allows you to reply directly to the sender
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Return success response with redirect
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/contact?success=true',
      },
    });

  } catch (error) {
    console.error('Email sending failed:', error);
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/contact?error=true',
      },
    });
  }
}; 