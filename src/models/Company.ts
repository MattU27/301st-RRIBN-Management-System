import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  code: string;
  description?: string;
  location?: string;
  commandingOfficer?: string;
  totalPersonnel: number;
  activePersonnel: number;
  readinessScore: number;
  documentsComplete: number;
  trainingsComplete: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  location: { type: String },
  commandingOfficer: { type: String },
  totalPersonnel: { type: Number, default: 0 },
  activePersonnel: { type: Number, default: 0 },
  readinessScore: { type: Number, default: 0 },
  documentsComplete: { type: Number, default: 0 },
  trainingsComplete: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add indexes for better query performance
CompanySchema.index({ name: 1 });
CompanySchema.index({ code: 1 });

// Create the model only if it doesn't exist (prevents "model already defined" errors)
export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company; 