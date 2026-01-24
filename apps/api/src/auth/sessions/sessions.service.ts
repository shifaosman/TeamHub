import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionStatus } from '@teamhub/shared';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>
  ) {}

  async create(createSessionDto: CreateSessionDto): Promise<SessionDocument> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for refresh token

    const session = new this.sessionModel({
      ...createSessionDto,
      expiresAt,
    });
    return session.save();
  }

  async findByRefreshToken(refreshToken: string): Promise<SessionDocument | null> {
    return this.sessionModel
      .findOne({ refreshToken, status: SessionStatus.ACTIVE })
      .exec();
  }

  async findByUserId(userId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({ userId, status: SessionStatus.ACTIVE })
      .sort({ createdAt: -1 })
      .exec();
  }

  async revoke(userId: string, token: string): Promise<void> {
    await this.sessionModel.updateOne(
      { userId, token },
      { status: SessionStatus.REVOKED }
    ).exec();
  }

  async revokeAll(userId: string): Promise<void> {
    await this.sessionModel.updateMany(
      { userId, status: SessionStatus.ACTIVE },
      { status: SessionStatus.REVOKED }
    ).exec();
  }

  async revokeById(sessionId: string, userId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { _id: sessionId, userId },
      { status: SessionStatus.REVOKED }
    ).exec();
  }
}
