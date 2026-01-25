import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug!: string;

  @Prop({ required: true, index: true })
  ownerId!: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

// Indexes for performance
OrganizationSchema.index({ ownerId: 1 });
OrganizationSchema.index({ slug: 1 });
