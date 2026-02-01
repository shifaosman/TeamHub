# TeamHub — Real Email Setup (Production)

This guide explains how to make TeamHub send **real emails** (verification + password reset) instead of logging them to the console.

## What already exists

- **Email service**: `apps/api/src/common/services/email.service.ts`
  - Uses **Nodemailer SMTP**
  - If SMTP is not configured, it logs emails to the server console (dev fallback)
- **Auth endpoints** (documented in Swagger):
  - `POST /api/auth/register` → sends verification email
  - `GET /api/auth/verify-email?token=...`
  - `POST /api/auth/resend-verification`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`

## Required environment variables

Set these in `apps/api/.env` (or your deployment environment variables):

```env
# Where links in emails should point to
APP_URL=https://your-frontend-domain.com

# Required for SMTP email sending
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

# From address shown to users
EMAIL_FROM="TeamHub <noreply@yourdomain.com>"
```

### How links are generated

The backend builds URLs like:
- Verification: `${APP_URL}/verify-email?token=...`
- Reset password: `${APP_URL}/reset-password?token=...`

So **APP_URL must be your real deployed frontend URL** (or `http://localhost:5173` locally).

## Provider setups (recommended options)

### Option A: Gmail SMTP (small demos only)

1. Enable 2‑factor auth on your Google account.
2. Create an **App Password**.
3. Use:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM="TeamHub <your-email@gmail.com>"
```

Notes:
- Gmail is not ideal for production apps (rate limits, deliverability).
- Prefer SendGrid/Mailgun/Postmark/SES for real deployments.

### Option B: SendGrid SMTP (easy production)

1. Create a SendGrid account.
2. Create an API key.
3. Use:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
EMAIL_FROM="TeamHub <noreply@yourdomain.com>"
```

Important:
- Verify your sender identity/domain in SendGrid.

### Option C: AWS SES SMTP (best cost at scale)

1. Verify a domain or sender in SES.
2. Move out of SES sandbox (or only verified recipients will work).
3. Create SMTP credentials in AWS SES.

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
EMAIL_FROM="TeamHub <noreply@yourdomain.com>"
```

## Local testing checklist

1. Ensure `apps/api/.env` has valid SMTP settings and `APP_URL=http://localhost:5173`.
2. Start the backend.
3. Register a new user.
4. Confirm the server logs **“Email service initialized with SMTP”** (not the warning).
5. Check your mailbox and click the verification link.

## Production checklist

- **DNS**
  - Set SPF + DKIM (provider instructions) for better deliverability.
- **APP_URL**
  - Must match your deployed web app domain.
- **HTTPS**
  - Use HTTPS in production (`https://...`) so links are trusted.
- **Sender**
  - Use a domain you control (`noreply@yourdomain.com`) rather than a personal mailbox.
- **Observability**
  - Watch logs for email send errors; consider adding provider webhooks later.

## Troubleshooting

### Emails still log to console (not sending)
The backend will log emails when any of these are missing:
- `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS`

### “Invalid login” / auth errors
Your SMTP credentials are wrong, or your provider requires a different port/secure setting.

### Links in emails open the wrong place
Set `APP_URL` correctly. This is the base for verification/reset links.

