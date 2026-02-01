import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { SessionsService } from './sessions/sessions.service';
import { EmailService } from '../common/services/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from '@teamhub/shared';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionsService: SessionsService,
    private emailService: EmailService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const existingUsername = await this.usersService.findByUsername(
      registerDto.username
    );
    if (existingUsername) {
      throw new BadRequestException('Username already taken');
    }

    const user = await this.usersService.create(registerDto);
    
    // Generate verification token and send email
    const verificationToken = await this.usersService.generateVerificationToken();
    await this.usersService.setVerificationToken(user.email, verificationToken);
    
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.username
      );
    } catch (error) {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', error);
    }

    const tokens = await this.generateTokens(user._id.toString());
    await this.sessionsService.create({
      userId: user._id.toString(),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    return {
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const userByEmail = await this.usersService.findByEmail(loginDto.email);
    if (userByEmail && !userByEmail.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user._id.toString());
    await this.sessionsService.create({
      userId: user._id.toString(),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      ipAddress,
      userAgent,
    });

    // Update last login
    await this.usersService.update(user._id.toString(), {
      lastLoginAt: new Date(),
    } as any);

    return {
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.usersService.validatePassword(user, password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const session = await this.sessionsService.findByRefreshToken(refreshToken);
    if (!session || session.status !== 'active') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = this.jwtService.decode(refreshToken) as any;
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = this.jwtService.sign(
      { sub: payload.sub },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }
    );

    return { accessToken: newAccessToken };
  }

  async logout(userId: string, token: string): Promise<void> {
    await this.sessionsService.revoke(userId, token);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    await this.usersService.verifyEmail(token);
    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = await this.usersService.generateVerificationToken();
    await this.usersService.setVerificationToken(user.email, verificationToken);

    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.username
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }

    return { message: 'Verification email sent' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const resetToken = await this.usersService.generatePasswordResetToken();
    await this.usersService.setPasswordResetToken(user.email, resetToken);

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.username
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new BadRequestException('Failed to send password reset email');
    }

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    await this.usersService.resetPassword(token, newPassword);
    return { message: 'Password reset successfully' };
  }

  private async generateTokens(userId: string) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
