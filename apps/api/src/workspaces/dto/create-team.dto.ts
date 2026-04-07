import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare workspaceId: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  declare name: string;

  @ApiProperty({ required: false, example: 'Backend and frontend engineers' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare description?: string;
}
