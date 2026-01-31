import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { UserRole } from '@teamhub/shared';

export type WorkspaceMemberDocument = HydratedDocument<WorkspaceMember>;

@Schema({ timestamps: true })
export class WorkspaceMember {
  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: string;

  @Prop({ type: String, enum: Object.values(UserRole), default: UserRole.MEMBER })
  role!: UserRole;

  @Prop({ default: Date.now })
  joinedAt!: Date;

  @Prop()
  lastActiveAt?: Date;
}

export const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);

// Indexes for performance - composite unique index ensures one membership per user per workspace
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
WorkspaceMemberSchema.index({ userId: 1 });
WorkspaceMemberSchema.index({ workspaceId: 1, role: 1 });
