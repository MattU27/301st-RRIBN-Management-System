import mongoose, { Document, Schema } from 'mongoose';

// Policy status enum
export enum PolicyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// Policy category enum
export enum PolicyCategory {
  OPERATIONS = 'Operations',
  SAFETY = 'Safety',
  HR = 'HR',
  FINANCE = 'Finance',
  SECURITY = 'Security',
  COMPLIANCE = 'Compliance',
  TRAINING = 'Training',
  PROMOTIONS = 'Promotions',
  GENERAL = 'General',
  CUSTOM = 'Custom'
}

// Policy interface
export interface IPolicy extends Document {
  title: string;
  description: string;
  content: string;
  category: PolicyCategory;
  version: string;
  status: PolicyStatus;
  effectiveDate: Date;
  expirationDate?: Date;
  documentUrl?: string;
  fileId?: mongoose.Types.ObjectId; // Store GridFS file ID
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Policy schema
const PolicySchema = new Schema<IPolicy>(
  {
    title: {
      type: String,
      required: [true, 'Policy title is required'],
      trim: true,
      maxlength: [200, 'Policy title cannot be more than 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Policy description is required'],
      trim: true,
      maxlength: [500, 'Policy description cannot be more than 500 characters']
    },
    content: {
      type: String,
      required: [true, 'Policy content is required']
    },
    category: {
      type: String,
      required: [true, 'Policy category is required']
    },
    version: {
      type: String,
      required: [true, 'Policy version is required'],
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(PolicyStatus),
      default: PolicyStatus.DRAFT
    },
    effectiveDate: {
      type: Date,
      required: [true, 'Effective date is required']
    },
    expirationDate: {
      type: Date
    },
    documentUrl: {
      type: String,
      trim: true
    },
    fileId: {
      type: Schema.Types.ObjectId,
      ref: 'fs.files'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required']
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for frequently queried fields
PolicySchema.index({ status: 1 });
PolicySchema.index({ category: 1 });
PolicySchema.index({ effectiveDate: 1 });
PolicySchema.index({ createdBy: 1 });

// Create a compound index for title and version to ensure uniqueness
PolicySchema.index({ title: 1, version: 1 }, { unique: true });

// Create the Policy model
const Policy = mongoose.models.Policy || mongoose.model<IPolicy>('Policy', PolicySchema);

export default Policy; 