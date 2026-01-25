import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  declare password: string;
}
