import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ProjectMember, ProjectMemberSchema } from './project-member.schema';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ maxlength: 2000 })
  description?: string;

  @Prop({ default: false })
  approvalRequired!: boolean;

  @Prop({ required: true, index: true })
  createdBy!: string;

  @Prop({ type: [ProjectMemberSchema], default: [] })
  members!: ProjectMember[];

  @Prop({ type: [String], default: [], index: true })
  teamIds!: string[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Indexes for performance
ProjectSchema.index({ workspaceId: 1, createdAt: -1 });
ProjectSchema.index({ workspaceId: 1, 'members.userId': 1 });
