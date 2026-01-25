import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AddReactionDto {
  @ApiProperty({ example: '👍' })
  @IsString()
  @MinLength(1)
  declare emoji: string;
}
