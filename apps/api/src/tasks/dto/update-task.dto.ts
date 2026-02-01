import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

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

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  declare assigneeId?: string | null;
}

