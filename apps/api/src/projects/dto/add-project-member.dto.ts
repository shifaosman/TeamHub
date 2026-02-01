import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class AddProjectMemberDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare userId: string;

  @ApiProperty({ required: false, enum: ['admin', 'member'], default: 'member' })
  @IsOptional()
  @IsIn(['admin', 'member'])
  declare role?: 'admin' | 'member';
}

