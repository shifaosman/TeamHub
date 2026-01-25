import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'This is a comment' })
  @IsString()
  @MinLength(1)
  declare content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare parentId?: string;
}
