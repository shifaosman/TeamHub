# Email Verification & Password Reset Guide

## ✅ Implementation Complete

Email verification and password reset functionality has been fully implemented.

## 🔧 Backend Implementation

### Email Service
- **Location**: `apps/api/src/common/services/email.service.ts`
- **Features**:
  - SMTP support via nodemailer
  - Falls back to console logging if SMTP not configured
  - HTML email templates
  - Verification and password reset emails

### API Endpoints

#### Email Verification
- **GET** `/api/auth/verify-email?token=<token>` - Verify email with token
- **POST** `/api/auth/resend-verification` - Resend verification email
  ```json
  { "email": "user@example.com" }
  ```

#### Password Reset
- **POST** `/api/auth/forgot-password` - Request password reset
  ```json
  { "email": "user@example.com" }
  ```
- **POST** `/api/auth/reset-password` - Reset password with token
  ```json
  {
    "token": "reset-token",
    "newPassword": "NewPassword123!"
  }
  ```

### User Schema Updates
- `isEmailVerified` - Boolean flag
- `emailVerificationToken` - Token for verification
- `passwordResetToken` - Token for password reset
- `passwordResetExpires` - Expiry date for reset token

## 🎨 Frontend Implementation

### Pages Created
1. **VerifyEmailPage** (`/verify-email?token=<token>`)
   - Auto-verifies on load
   - Shows success/error states
   - Redirects to login after 3 seconds

2. **ForgotPasswordPage** (`/forgot-password`)
   - Email input form
   - Success message after submission

3. **ResetPasswordPage** (`/reset-password?token=<token>`)
   - New password form
   - Password confirmation
   - Success state with redirect

### Components
- **EmailVerificationBanner** - Shows banner if email not verified
- **useResendVerification** - Hook to resend verification email

### Updated Pages
- **LoginPage** - Added "Forgot Password" link
- **RegisterPage** - Shows verification message after registration

## ⚙️ Configuration

### Environment Variables

Add to `apps/api/.env`:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@teamhub.com

# Application URL (for email links)
APP_URL=http://localhost:5173
```

### SMTP Providers

#### Gmail
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password as `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

#### SendGrid
1. Create account at https://sendgrid.com
2. Create API key
3. Use `apikey` as username

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
```

#### AWS SES
1. Verify email/domain in SES
2. Create SMTP credentials

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```

## 🚀 How It Works

### Registration Flow
1. User registers → Account created
2. Verification token generated
3. Verification email sent (if SMTP configured)
4. User sees "Check your email" message
5. User clicks link in email → Email verified

### Password Reset Flow
1. User clicks "Forgot Password" on login page
2. Enters email address
3. Reset token generated (1-hour expiry)
4. Reset email sent
5. User clicks link → Reset password page
6. User enters new password → Password reset

### Email Verification Banner
- Shows at top of app if email not verified
- "Resend Email" button
- Dismissible
- Auto-hides when email is verified

## 🔒 Security Features

1. **Token Expiry**: Password reset tokens expire after 1 hour
2. **Secure Tokens**: 32-byte random tokens
3. **No User Enumeration**: "User not found" returns same message
4. **Email Verification Guard**: Optional guard to block unverified users

## 📝 Usage Examples

### Enable Email Verification Requirement

To require email verification before accessing features, use the `EmailVerifiedGuard`:

```typescript
import { UseGuards } from '@nestjs/common';
import { EmailVerifiedGuard } from '../common/guards/email-verified.guard';

@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@Get('protected')
async protectedRoute() {
  // Only accessible to verified users
}
```

### Development Mode

If SMTP is not configured, emails are logged to console:
```
[EMAIL] To: user@example.com
[EMAIL] Subject: Verify your TeamHub account
[EMAIL] Body: [email content]
```

You can copy the verification link from the console logs.

## 🧪 Testing

### Test Email Verification
1. Register a new user
2. Check console logs (if SMTP not configured) or email inbox
3. Click verification link
4. Should redirect to login with success message

### Test Password Reset
1. Go to `/forgot-password`
2. Enter email
3. Check console logs or email for reset link
4. Click link and reset password
5. Login with new password

## 📚 API Documentation

All endpoints are documented in Swagger:
- Visit `http://localhost:2000/docs`
- Navigate to "auth" section
- See request/response schemas

## ✅ Status

**Implementation**: ✅ **COMPLETE**

All features from Phase 1, Enhancement #1 are implemented:
- ✅ Email verification on registration
- ✅ Verification email sending
- ✅ Email verification endpoint
- ✅ Resend verification email
- ✅ Password reset flow
- ✅ Frontend pages
- ✅ Email service with SMTP support
- ✅ Email templates
- ✅ Email verification banner

**Optional** (not required but available):
- EmailVerifiedGuard for blocking unverified users
