import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ChannelType } from '@teamhub/shared';

export class CreateChannelDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare workspaceId: string;

  @ApiProperty({ example: 'general' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  declare name: string;

  @ApiProperty({ enum: ChannelType, default: ChannelType.PUBLIC })
  @IsEnum(ChannelType)
  declare type: ChannelType;

  @ApiProperty({ required: false, example: 'General discussion channel' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  declare description?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare memberIds?: string[];
}
