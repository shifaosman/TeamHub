import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UploadFileDto {
  @ApiProperty()
  @IsString()
  declare workspaceId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare channelId?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  declare isPublic?: boolean;
}
