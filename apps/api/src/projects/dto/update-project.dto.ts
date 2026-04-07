import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProjectDto {
  @ApiProperty({ required: false, example: 'Website Redesign' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  declare name?: string;

  @ApiProperty({ required: false, example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  declare description?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  declare approvalRequired?: boolean;
}

