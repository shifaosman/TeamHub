import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ReorderTaskItemDto {
  @ApiProperty()
  @IsString()
  declare taskId: string;

  @ApiProperty({ example: 1000 })
  @IsInt()
  @Min(0)
  declare order: number;

  @ApiProperty({ required: false, enum: ['todo', 'in-progress', 'done'] })
  @IsOptional()
  @IsIn(['todo', 'in-progress', 'done'])
  declare status?: 'todo' | 'in-progress' | 'done';
}

export class ReorderTasksDto {
  @ApiProperty()
  @IsString()
  declare projectId: string;

  @ApiProperty()
  @IsString()
  declare workspaceId: string;

  @ApiProperty({ type: [ReorderTaskItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderTaskItemDto)
  declare items: ReorderTaskItemDto[];
}

