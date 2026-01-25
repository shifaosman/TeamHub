import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsArray } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare channelId: string;

  @ApiProperty({ example: 'Hello everyone!', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  declare content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare threadId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare replyToId?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare attachments?: string[];
}
