import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsArray } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare workspaceId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare parentId?: string;

  @ApiProperty({ example: 'My Note' })
  @IsString()
  @MinLength(1)
  declare title: string;

  @ApiProperty({ example: 'Note content here...' })
  @IsString()
  declare content: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare teamIds?: string[];
}
