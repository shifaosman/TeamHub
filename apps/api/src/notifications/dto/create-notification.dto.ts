import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { NotificationType } from '@teamhub/shared';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  declare userId: string;

  @ApiProperty()
  @IsString()
  declare workspaceId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  declare type: NotificationType;

  @ApiProperty()
  @IsString()
  declare title: string;

  @ApiProperty()
  @IsString()
  declare body: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare link?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  declare metadata?: Record<string, unknown>;
}
