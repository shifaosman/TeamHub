import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  declare title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  declare isArchived?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare parentId?: string;
}
