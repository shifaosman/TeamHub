import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;
export type ReportType = 'complaint' | 'workload_low' | 'workload_high';
export type ReportStatus = 'pending' | 'resolved';

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: true, index: true })
  reporterId!: string;

  @Prop({ required: true, index: true })
  targetUserId!: string;

  @Prop({ required: true, index: true })
  teamId!: string;

  @Prop({ index: true })
  messageId?: string;

  @Prop({ type: String, enum: ['complaint', 'workload_low', 'workload_high'], required: true })
  type!: ReportType;

  @Prop({ required: true, maxlength: 2000 })
  description!: string;

  @Prop({ type: String, enum: ['pending', 'resolved'], default: 'pending', index: true })
  status!: ReportStatus;

  @Prop({ type: [String], default: [] })
  routedToRoles!: string[];
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ teamId: 1, status: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });
