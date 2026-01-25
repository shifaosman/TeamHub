import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

interface EmailNotificationJob {
  userId: string;
  notificationId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<EmailNotificationJob>): Promise<void> {
    const { userId, notificationId, title, body, link } = job.data;

    this.logger.log(`Processing email notification for user ${userId}, notification ${notificationId}`);

    // In production, this would send an actual email using a service like SendGrid, AWS SES, etc.
    // For now, we'll just log it
    this.logger.log(`Email notification:
      To: User ${userId}
      Subject: ${title}
      Body: ${body}
      Link: ${link || 'N/A'}
    `);

    // Example: Send email using a service
    // await this.emailService.send({
    //   to: user.email,
    //   subject: title,
    //   html: this.generateEmailTemplate(title, body, link),
    // });
  }

  private generateEmailTemplate(title: string, body: string, link?: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TeamHub</h1>
            </div>
            <div class="content">
              <h2>${title}</h2>
              <p>${body}</p>
              ${link ? `<a href="${link}" class="button">View Details</a>` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
