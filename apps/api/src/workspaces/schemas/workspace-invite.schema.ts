import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '@teamhub/shared';
import * as crypto from 'crypto';

export type WorkspaceInviteDocument = HydratedDocument<WorkspaceInvite>;

@Schema({ timestamps: true })
export class WorkspaceInvite {
  @Prop({ required: true, index: true })
  workspaceId!: string;

  // Optional: email-bound invites (classic). For shareable invite links, this will be absent.
  @Prop({ required: false, lowercase: true, trim: true, index: true })
  email?: string;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.MEMBER })
  role!: UserRole;

  @Prop({ required: true, index: true })
  invitedBy!: string;

  @Prop({ required: true, unique: true, index: true })
  token!: string;

  // Short code for humans (can be shared/typed). We keep token for uniqueness/security.
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  // Allow single-use by default (like email invites); can be increased later.
  @Prop({ default: 1 })
  maxUses!: number;

  @Prop({ default: 0 })
  usesCount!: number;

  @Prop()
  usedAt?: Date;
}

export const WorkspaceInviteSchema = SchemaFactory.createForClass(WorkspaceInvite);

// Indexes for performance
// Only enforce workspace+email uniqueness when email exists (shareable links have no email).
WorkspaceInviteSchema.index(
  { workspaceId: 1, email: 1 },
  { partialFilterExpression: { email: { $type: 'string' } } }
);
WorkspaceInviteSchema.index({ token: 1 });
WorkspaceInviteSchema.index({ code: 1 });
WorkspaceInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate token before saving
WorkspaceInviteSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  if (!this.code) {
    // 8-char code (hex) grouped for readability: ab12-cd34
    const raw = crypto.randomBytes(4).toString('hex');
    this.code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
  }
  next();
});
