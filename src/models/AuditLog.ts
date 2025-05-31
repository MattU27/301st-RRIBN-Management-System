import mongoose, { Schema, Document } from 'mongoose';

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'download'
  | 'upload'
  | 'verify'
  | 'reject'
  | 'approve'
  | 'register'
  | 'cancel'
  | 'export'
  | 'import'
  | 'system';

export type AuditResource =
  | 'user'
  | 'personnel'
  | 'document'
  | 'training'
  | 'announcement'
  | 'report'
  | 'system';

export interface IAuditLog extends Document {
  timestamp: Date;
  userId: number | string;
  userName: string;
  userRole: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  userId: {
    type: Schema.Types.Mixed,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'create',
      'update',
      'delete',
      'view',
      'download',
      'upload',
      'verify',
      'reject',
      'approve',
      'register',
      'cancel',
      'export',
      'import',
      'system'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'user',
      'personnel',
      'document',
      'training',
      'announcement',
      'report',
      'system'
    ]
  },
  resourceId: {
    type: Schema.Types.Mixed
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: false
});

// Create indexes for better query performance
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resource: 1 });
AuditLogSchema.index({ userName: 'text', details: 'text' });

// Check if the model already exists to prevent OverwriteModelError during hot reloads
const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog; 