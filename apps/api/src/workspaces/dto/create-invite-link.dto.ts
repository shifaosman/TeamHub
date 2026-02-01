import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { UserRole } from '@teamhub/shared';

export class CreateInviteLinkDto {
  @ApiProperty({ enum: UserRole, required: false, default: UserRole.MEMBER })
  @IsOptional()
  @IsEnum(UserRole)
  declare role?: UserRole;

  @ApiProperty({
    required: false,
    default: 7,
    description: 'Invite expiry (days from now).',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  declare expiresInDays?: number;

  @ApiProperty({
    required: false,
    default: 1,
    description: 'Max number of times this invite link can be used.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  declare maxUses?: number;
}

