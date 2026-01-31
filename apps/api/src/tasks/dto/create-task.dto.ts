import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare projectId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare workspaceId: string;

  @ApiProperty({ example: 'Design login screen' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  declare title: string;

  @ApiProperty({ required: false, example: 'Include mobile + desktop variants' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  declare description?: string;

  @ApiProperty({ required: false, enum: ['todo', 'in-progress', 'done'], default: 'todo' })
  @IsOptional()
  @IsIn(['todo', 'in-progress', 'done'])
  declare status?: 'todo' | 'in-progress' | 'done';

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  declare assigneeId?: string | null;
}

