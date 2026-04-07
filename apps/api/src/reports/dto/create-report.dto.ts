import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare targetUserId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare teamId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  declare messageId?: string;

  @ApiProperty({ enum: ['complaint', 'workload_low', 'workload_high'] })
  @IsIn(['complaint', 'workload_low', 'workload_high'])
  declare type: 'complaint' | 'workload_low' | 'workload_high';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  declare description: string;
}
