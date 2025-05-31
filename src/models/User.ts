import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@/types/auth';

// Define military ranks
export enum MilitaryRank {
  // Enlisted Ranks
  PRIVATE = 'Private',
  PFC = 'Private First Class',
  CORPORAL = 'Corporal',
  SERGEANT = 'Sergeant',
  
  // Officer Ranks
  SECOND_LIEUTENANT = 'Second Lieutenant',
  FIRST_LIEUTENANT = 'First Lieutenant',
  CAPTAIN = 'Captain',
  MAJOR = 'Major',
  LIEUTENANT_COLONEL = 'Lieutenant Colonel',
  COLONEL = 'Colonel',
  BRIGADIER_GENERAL = 'Brigadier General',
  MAJOR_GENERAL = 'Major General',
  LIEUTENANT_GENERAL = 'Lieutenant General',
  GENERAL = 'General',
}

// Define companies
export enum Company {
  ALPHA = 'Alpha',
  BRAVO = 'Bravo',
  CHARLIE = 'Charlie',
  HQ = 'Headquarters',
  NERRSC = 'NERRSC',
  NERRFAB = 'NERRFAB',
  NERRSC_FULL = 'NERRSC (NERR-Signal Company)',
  NERRFAB_FULL = 'NERRFAB (NERR-Field Artillery Battery)'
}

// Maximum number of previous passwords to store for password history
export const MAX_PASSWORD_HISTORY = 5;

// Define the user document interface
export interface IUser extends mongoose.Document {
  firstName: string;
  lastName: string;
  email: string;
  alternativeEmail?: string;
  password: string;
  passwordHistory: string[]; // Array to store previous password hashes
  role: UserRole;
  status: UserStatus;
  rank?: MilitaryRank;
  company?: Company;
  serviceId: string;
  contactNumber?: string;
  dateOfBirth?: Date;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    contactNumber?: string;
  };
  profileImage?: string;
  specializations?: string[];
  lastLogin?: Date;
  deactivationReason?: string;
  isArchived?: boolean;
  canRegister?: boolean; // Flag for Service IDs uploaded by staff that can be registered
  isRegistrationComplete?: boolean; // Flag to indicate if registration is complete
  createdBy?: mongoose.Types.ObjectId; // Reference to the user who created this record
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isPasswordInHistory(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
}

// Define the User schema
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please provide your first name'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Please provide your last name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  alternativeEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid alternative email address'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password should be at least 8 characters long'],
    select: false, // Don't return password in queries by default
  },
  passwordHistory: {
    type: [String],
    default: [],
    select: false, // Don't return password history in queries by default
  },
  serviceId: {
    type: String,
    required: [true, 'Please provide your Service ID'],
    trim: true,
  },
  role: {
    type: String,
    default: 'staff',
    enum: [
      'staff',
      'administrator',
      'admin',
      'director',
      'reservist',
      'enlisted'
    ]
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING,
  },
  deactivationReason: {
    type: String,
    required: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true, // Add index for faster filtering
    description: 'Flag indicating if the user has been archived'
  },
  rank: {
    type: String,
    required: false,
  },
  company: {
    type: String,
    required: false,
    enum: [
      'Alpha', 
      'Bravo', 
      'Charlie', 
      'Headquarters', 
      'NERRSC', 
      'NERRFAB',
      'NERRSC (NERR-Signal Company)',
      'NERRFAB (NERR-Field Artillery Battery)'
    ]
  },
  contactNumber: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
  },
  emergencyContact: {
    name: String,
    relationship: String,
    contactNumber: String,
  },
  profileImage: {
    type: String,
  },
  specializations: [{
    type: String,
  }],
  lastLogin: {
    type: Date,
  },
  canRegister: {
    type: Boolean,
    default: false,
    description: 'Flag indicating if this Service ID can be used for registration'
  },
  isRegistrationComplete: {
    type: Boolean,
    default: false,
    description: 'Flag indicating if registration has been completed by the user'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'Reference to the user who created this record'
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

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Add the current password to password history before changing it
    if (this.password && this.isModified('password') && !this.isNew) {
      // Only push to history if this is a password update, not a new user
      if (!this.passwordHistory) {
        this.passwordHistory = [];
      }
      
      // Add current password to history
      this.passwordHistory.unshift(this.password);
      
      // Limit the history size
      if (this.passwordHistory.length > MAX_PASSWORD_HISTORY) {
        this.passwordHistory = this.passwordHistory.slice(0, MAX_PASSWORD_HISTORY);
      }
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Check if password exists in password history
UserSchema.methods.isPasswordInHistory = async function(candidatePassword: string): Promise<boolean> {
  try {
    // If no password history, return false
    if (!this.passwordHistory || this.passwordHistory.length === 0) {
      return false;
    }
    
    // Check if the candidate password matches any of the stored historical passwords
    for (const historicalPassword of this.passwordHistory) {
      if (await bcrypt.compare(candidatePassword, historicalPassword)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking password history:', error);
    return false;
  }
};

// Get full name method
UserSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Create and export the User model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 