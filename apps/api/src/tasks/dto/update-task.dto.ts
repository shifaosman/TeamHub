import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTaskDto {
  @ApiProperty({ required: false, example: 'Design login screen' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  declare title?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  declare description?: string | null;

  @ApiProperty({ required: false, enum: ['todo', 'in-progress', 'done'] })
  @IsOptional()
  @IsIn(['todo', 'in-progress', 'done'])
  declare status?: 'todo' | 'in-progress' | 'done';

  @ApiProperty({ required: false, enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  declare priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare labels?: string[];

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  declare assigneeId?: string | null;
}

