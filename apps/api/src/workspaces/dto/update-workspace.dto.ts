import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WorkspaceSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  declare allowPublicChannels?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  declare allowPrivateChannels?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  declare allowDMs?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  declare requireInvite?: boolean;
}

export class UpdateWorkspaceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  declare name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare description?: string;

  @ApiProperty({ required: false, type: WorkspaceSettingsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkspaceSettingsDto)
  declare settings?: WorkspaceSettingsDto;
}
