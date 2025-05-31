import mongoose from 'mongoose';

// Define training status
export enum TrainingStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Define training types
export enum TrainingType {
  FIELD_EXERCISE = 'field_exercise',
  CLASSROOM = 'classroom',
  ONLINE = 'online',
  SEMINAR = 'seminar',
  WORKSHOP = 'workshop',
  COMBAT_DRILL = 'combat_drill',
  MEDICAL = 'medical',
  TECHNICAL = 'technical',
  LEADERSHIP = 'leadership',
  OTHER = 'other',
}

// Define the attendee status
export type AttendeeStatus = 'registered' | 'attended' | 'completed' | 'absent' | 'excused';

// Define the training interface
export interface ITraining extends mongoose.Document {
  title: string;
  description?: string;
  type: TrainingType;
  startDate: Date;
  endDate: Date;
  location?: {
    name?: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  instructor?: {
    name?: string;
    rank?: string;
    specialization?: string;
    contactInfo?: string;
  };
  status: TrainingStatus;
  capacity?: number;
  registered?: number;
  eligibleRanks?: string[];
  eligibleCompanies?: string[];
  mandatory: boolean;
  virtualMeetingUrl?: string;
  materials?: Array<{
    title: string;
    fileUrl: string;
    fileType: string;
  }>;
  attendees?: Array<{
    userId: mongoose.Types.ObjectId;
    status: AttendeeStatus;
    registrationDate: Date;
    completionDate?: Date;
    certificateUrl?: string;
    feedback?: string;
    performance?: {
      score?: number;
      notes?: string;
    };
  }>;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  tags?: string[];
  certificationOffered: boolean;
  certificationValidityPeriod?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Training schema
const TrainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a training title'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: Object.values(TrainingType),
    required: [true, 'Please specify the training type'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  instructor: {
    name: String,
    rank: String,
    specialization: String,
    contactInfo: String,
  },
  status: {
    type: String,
    enum: Object.values(TrainingStatus),
    default: TrainingStatus.UPCOMING,
  },
  capacity: {
    type: Number,
  },
  registered: {
    type: Number,
    default: 0,
  },
  eligibleRanks: [{
    type: String,
  }],
  eligibleCompanies: [{
    type: String,
  }],
  mandatory: {
    type: Boolean,
    default: false,
  },
  virtualMeetingUrl: {
    type: String,
  },
  materials: [{
    title: String,
    fileUrl: String,
    fileType: String,
  }],
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'completed', 'absent', 'excused'],
      default: 'registered',
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    completionDate: Date,
    certificateUrl: String,
    feedback: String,
    performance: {
      score: Number,
      notes: String,
    },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required'],
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  tags: [{
    type: String,
  }],
  certificationOffered: {
    type: Boolean,
    default: false,
  },
  certificationValidityPeriod: {
    type: Number, // In months
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Create indexes for efficient queries
TrainingSchema.index({ startDate: 1 });
TrainingSchema.index({ status: 1 });
TrainingSchema.index({ 'attendees.userId': 1 });

// Create and export the Training model
export default mongoose.models.Training || mongoose.model<ITraining>('Training', TrainingSchema); 