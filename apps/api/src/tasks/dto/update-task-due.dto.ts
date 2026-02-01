import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateTaskDueDto {
  @ApiProperty({ required: false, nullable: true, example: '2026-02-01T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  declare dueAt?: string | null;
}

