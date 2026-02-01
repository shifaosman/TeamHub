import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare workspaceId: string;

  @ApiProperty({ example: 'Website Redesign' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  declare name: string;

  @ApiProperty({ required: false, example: 'Track tasks for Q1 redesign initiative' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  declare description?: string;
}

