import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TeamDocument = HydratedDocument<Team>;

@Schema({ timestamps: true })
export class Team {
  @Prop({ required: true, index: true })
  workspaceId!: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ required: true, index: true })
  createdBy!: string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

TeamSchema.index({ workspaceId: 1, name: 1 }, { unique: true });
