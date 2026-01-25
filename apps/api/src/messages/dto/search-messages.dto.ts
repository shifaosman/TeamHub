import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsBoolean, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchMessagesDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare workspaceId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare query: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare channelId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  declare hasFile?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  declare hasLink?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  declare dateFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  declare dateTo?: string;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  declare limit?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  declare offset?: number;
}
