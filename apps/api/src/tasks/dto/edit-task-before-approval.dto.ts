import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class EditTaskBeforeApprovalDto {
  @ApiProperty({ required: false, example: 'Refined task title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  declare title?: string;

  @ApiProperty({ required: false, example: 'Updated description for approval' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  declare description?: string;

  @ApiProperty({ required: false, enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  declare priority?: 'low' | 'medium' | 'high' | 'urgent';
}
