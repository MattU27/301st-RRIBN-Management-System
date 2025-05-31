import mongoose from 'mongoose';

export type RegistrationStatus = 'registered' | 'attended' | 'completed' | 'absent' | 'excused' | 'cancelled';

// Interface for training registration document
export interface ITrainingRegistration extends mongoose.Document {
  trainingId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: RegistrationStatus;
  registrationDate: Date;
  attendanceDate?: Date;
  completionDate?: Date;
  userData?: {
    firstName: string;
    lastName: string;
    fullName: string;
    rank: string;
    company: string;
    email: string;
    militaryId: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema for tracking registrations
const TrainingRegistrationSchema = new mongoose.Schema({
  trainingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Training',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'completed', 'absent', 'excused', 'cancelled'],
    default: 'registered'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  attendanceDate: Date,
  completionDate: Date,
  userData: {
    firstName: String,
    lastName: String,
    fullName: String,
    rank: String,
    company: String,
    email: String,
    militaryId: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index to ensure unique registrations per training and user
TrainingRegistrationSchema.index({ trainingId: 1, userId: 1 }, { unique: true });

// Create indexes for efficient querying
TrainingRegistrationSchema.index({ trainingId: 1 });
TrainingRegistrationSchema.index({ userId: 1 });
TrainingRegistrationSchema.index({ status: 1 });

// Export the TrainingRegistration model
export default mongoose.models.TrainingRegistration || 
  mongoose.model<ITrainingRegistration>('TrainingRegistration', TrainingRegistrationSchema); 