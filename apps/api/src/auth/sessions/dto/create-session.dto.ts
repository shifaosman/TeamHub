export class CreateSessionDto {
  declare userId: string;
  declare token: string;
  declare refreshToken: string;
  declare ipAddress?: string;
  declare userAgent?: string;
}
