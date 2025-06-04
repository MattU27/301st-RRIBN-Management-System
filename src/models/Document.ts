import mongoose from 'mongoose';

// Define document status
export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// Define document types
export enum DocumentType {
  TRAINING_CERTIFICATE = 'training_certificate',
  MEDICAL_RECORD = 'medical_record',
  IDENTIFICATION = 'identification',
  PROMOTION = 'promotion',
  COMMENDATION = 'commendation',
  OTHER = 'other',
}

// Define the document interface
export interface IDocument extends mongoose.Document {
  title: string;
  description?: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  userId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId | any; // Allow for populated user object
  status: DocumentStatus;
  verifiedBy?: mongoose.Types.ObjectId | any; // Allow for populated user object
  verificationDate?: Date;
  verificationNotes?: string;
  version: number;
  previousVersions?: Array<{
    version: number;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadDate: Date;
    notes?: string;
  }>;
  tags?: string[];
  expirationDate?: Date;
  issuedBy?: string;
  issuedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  verifiedDate: Date;
  comments: string;
  uploadDate: Date;
}

// Define the Document schema
const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a document title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: Object.values(DocumentType),
    required: [true, 'Please specify the document type'],
  },
  fileUrl: {
    type: String,
    required: [true, 'Document file URL is required'],
  },
  fileName: {
    type: String,
    required: [true, 'Document file name is required'],
  },
  fileSize: {
    type: Number,
    required: [true, 'Document file size is required'],
  },
  mimeType: {
    type: String,
    required: [true, 'Document MIME type is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader reference is required'],
  },
  status: {
    type: String,
    enum: Object.values(DocumentStatus),
    default: DocumentStatus.PENDING,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verificationDate: {
    type: Date,
  },
  verificationNotes: {
    type: String,
  },
  version: {
    type: Number,
    default: 1,
  },
  previousVersions: [{
    version: Number,
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadDate: Date,
    notes: String,
  }],
  tags: [{
    type: String,
  }],
  expirationDate: {
    type: Date,
  },
  issuedBy: {
    type: String,
  },
  issuedDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    required: [true, 'Please provide a document name'],
    trim: true,
  },
  verifiedDate: {
    type: Date,
  },
  comments: {
    type: String,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true }, // Enable virtuals when converting to JSON
  toObject: { virtuals: true } // Enable virtuals when converting to object
});

// Create and export the Document model
export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema); 