import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class UpdateProjectMemberRoleDto {
  @ApiProperty({ enum: ['admin', 'member'] })
  @IsString()
  @IsIn(['admin', 'member'])
  declare role: 'admin' | 'member';
}

