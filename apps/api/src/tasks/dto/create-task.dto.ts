import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @ApiProperty({ required: false, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  declare priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty({ required: false, example: ['bug', 'feature'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare labels?: string[];

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  declare assigneeId?: string | null;

  @ApiProperty({ required: false, nullable: true, example: '2025-12-31T23:59:59.000Z' })
  @IsOptional()
  declare dueAt?: string | null;
}

