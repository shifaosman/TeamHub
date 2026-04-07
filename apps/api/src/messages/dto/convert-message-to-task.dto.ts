import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ConvertMessageToTaskDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare projectId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  declare title?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  declare assigneeId?: string | null;
}
