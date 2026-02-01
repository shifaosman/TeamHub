import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectMemberDocument = HydratedDocument<ProjectMember>;

export type ProjectMemberRole = 'admin' | 'member';

@Schema({ _id: false })
export class ProjectMember {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ type: String, enum: ['admin', 'member'], default: 'member' })
  role!: ProjectMemberRole;
}

export const ProjectMemberSchema = SchemaFactory.createForClass(ProjectMember);
