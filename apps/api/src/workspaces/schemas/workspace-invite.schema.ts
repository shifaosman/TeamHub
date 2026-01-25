import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '@teamhub/shared';
import * as crypto from 'crypto';

export type WorkspaceInviteDocument = HydratedDocument<WorkspaceInvite>;

@Schema({ timestamps: true })
export class WorkspaceInvite {
  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.MEMBER })
  role!: UserRole;

  @Prop({ required: true, index: true })
  invitedBy!: string;

  @Prop({ required: true, unique: true, index: true })
  token!: string;

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  @Prop()
  usedAt?: Date;
}

export const WorkspaceInviteSchema = SchemaFactory.createForClass(WorkspaceInvite);

// Indexes for performance
WorkspaceInviteSchema.index({ workspaceId: 1, email: 1 });
WorkspaceInviteSchema.index({ token: 1 });
WorkspaceInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate token before saving
WorkspaceInviteSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});
