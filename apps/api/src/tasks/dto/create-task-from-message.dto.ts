import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTaskFromMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare messageId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare projectId: string;

  @ApiProperty({ required: false, example: 'Follow up on message' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  declare title?: string;

  @ApiProperty({ required: false, enum: ['todo', 'in-progress', 'done'], default: 'todo' })
  @IsOptional()
  @IsIn(['todo', 'in-progress', 'done'])
  declare status?: 'todo' | 'in-progress' | 'done';

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  declare assigneeId?: string | null;
}

