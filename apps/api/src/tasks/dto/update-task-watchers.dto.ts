import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateTaskWatchersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  declare watcherIds: string[];
}

