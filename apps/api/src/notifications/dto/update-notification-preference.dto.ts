import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { NotificationPreference } from '@teamhub/shared';

export class UpdateNotificationPreferenceDto {
  @ApiProperty({ enum: NotificationPreference, required: false })
  @IsOptional()
  @IsEnum(NotificationPreference)
  declare preference?: NotificationPreference;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  declare emailEnabled?: boolean;
}
