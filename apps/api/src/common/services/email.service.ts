import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    // Only create transporter if SMTP is configured
    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          // Allow self-signed certificates (needed for corporate proxies)
          rejectUnauthorized: false,
        },
      });
      this.logger.log('Email service initialized with SMTP');
    } else {
      this.logger.warn('SMTP not configured - emails will be logged to console only');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    const from = this.configService.get<string>('EMAIL_FROM', 'noreply@teamhub.com');

    if (!this.transporter) {
      // Log email instead of sending (for development)
      this.logger.log(`[EMAIL] To: ${to}`);
      this.logger.log(`[EMAIL] Subject: ${subject}`);
      this.logger.log(`[EMAIL] Body: ${text || html}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, token: string, username: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:5173');
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;

    const html = this.generateVerificationEmailTemplate(username, verificationUrl);
    const text = `Hi ${username},\n\nPlease verify your email by clicking this link: ${verificationUrl}`;

    await this.sendEmail(email, 'Verify your TeamHub account', html, text);
  }

  async sendPasswordResetEmail(email: string, token: string, username: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:5173');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const html = this.generatePasswordResetEmailTemplate(username, resetUrl);
    const text = `Hi ${username},\n\nReset your password by clicking this link: ${resetUrl}\n\nThis link will expire in 1 hour.`;

    await this.sendEmail(email, 'Reset your TeamHub password', html, text);
  }

  private generateVerificationEmailTemplate(username: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TeamHub</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${username}!</h2>
              <p>Thank you for signing up for TeamHub. Please verify your email address to complete your registration.</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #4F46E5; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>This email was sent by TeamHub. If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generatePasswordResetEmailTemplate(username: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TeamHub</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hi ${username},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
              </div>
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            <div class="footer">
              <p>This email was sent by TeamHub. If you didn't request a password reset, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n');
  }
}
