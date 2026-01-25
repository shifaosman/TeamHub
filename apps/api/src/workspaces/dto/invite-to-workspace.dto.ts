import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@teamhub/shared';

export class InviteToWorkspaceDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  declare email: string;

  @ApiProperty({ enum: UserRole, required: false, default: UserRole.MEMBER })
  @IsOptional()
  @IsEnum(UserRole)
  declare role?: UserRole;
}
