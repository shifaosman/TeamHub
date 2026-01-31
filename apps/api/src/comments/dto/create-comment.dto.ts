import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare taskId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare projectId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare workspaceId: string;

  @ApiProperty({ example: 'We should split this into smaller subtasks.' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  declare body: string;
}

