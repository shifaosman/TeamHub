import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  declare organizationId: string;

  @ApiProperty({ example: 'Engineering Team' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  declare name: string;

  @ApiProperty({ example: 'engineering' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  declare slug: string;

  @ApiProperty({ required: false, example: 'Workspace for the engineering team' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare description?: string;
}
