import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { UsersModule } from '../users/users.module';
import { EmailVerifiedGuard } from './guards/email-verified.guard';

@Global()
@Module({
  imports: [ConfigModule, UsersModule],
  providers: [EmailService, EmailVerifiedGuard],
  exports: [EmailService, EmailVerifiedGuard],
})
export class CommonModule {}
