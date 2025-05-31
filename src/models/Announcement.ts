import mongoose from 'mongoose';

export interface AnnouncementDocument extends mongoose.Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  authorName: string;
  status: 'draft' | 'published' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetCompanies: mongoose.Types.ObjectId[] | null; // null means all companies
  targetRoles: string[] | null; // null means all roles
  publishDate: Date;
  expiryDate: Date | null; // null means no expiry
  attachmentUrls: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    targetCompanies: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Company',
      default: null // null means all companies
    },
    targetRoles: {
      type: [String],
      default: null // null means all roles
    },
    publishDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      default: null // null means no expiry
    },
    attachmentUrls: {
      type: [String],
      default: []
    },
    viewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Announcement || mongoose.model<AnnouncementDocument>('Announcement', AnnouncementSchema); 