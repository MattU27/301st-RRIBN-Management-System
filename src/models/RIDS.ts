import mongoose from 'mongoose';

// Define interfaces for type checking
interface PersonalInformation {
  fullName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  civilStatus: string;
  religion?: string;
  citizenship: string;
  bloodType?: string;
}

interface ContactInformation {
  residentialAddress: string;
  officeAddress?: string;
  mobileNumber: string;
  officePhone?: string;
  emailAddress: string;
}

interface IdentificationInfo {
  serviceId: string;
  height: string;
  weight: string;
  sssNumber?: string;
  tinNumber?: string;
  philHealthNumber?: string;
  pagIbigNumber?: string;
}

interface EducationalBackground {
  highestEducation: string;
  course?: string;
  school: string;
  yearGraduated: string;
}

interface OccupationInfo {
  occupation: string;
  employer?: string;
  officeAddress?: string;
}

interface MilitaryTraining {
  name: string;
  authority: string;
  dateCompleted: string;
}

interface Award {
  title: string;
  authority: string;
  dateAwarded: string;
}

interface Assignment {
  authority: string;
  dateFrom: string;
  dateTo: string;
}

// Define the RIDS schema
const RIDSSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Form completion and verification status
  isComplete: {
    type: Boolean,
    default: false
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  submissionDate: {
    type: Date
  },
  verificationDate: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  
  // Path to uploaded RIDS PDF file
  filePath: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Personal Information Section
  personalInformation: {
    fullName: String,
    dateOfBirth: String,
    placeOfBirth: String,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    civilStatus: {
      type: String,
      enum: ['Single', 'Married', 'Widowed', 'Separated', 'Divorced']
    },
    religion: String,
    citizenship: String,
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    }
  },
  
  // Contact Information Section
  contactInformation: {
    residentialAddress: String,
    officeAddress: String,
    mobileNumber: String,
    officePhone: String,
    emailAddress: String
  },
  
  // Identification Information
  identificationInfo: {
    serviceId: String, // Military/Service ID
    height: String,
    weight: String,
    sssNumber: String,
    tinNumber: String,
    philHealthNumber: String,
    pagIbigNumber: String
  },
  
  // Educational Background
  educationalBackground: {
    highestEducation: {
      type: String,
      enum: ['High School', 'Vocational', 'Bachelor', 'Master', 'Doctorate', 'Other']
    },
    course: String,
    school: String,
    yearGraduated: String
  },
  
  // Occupation Information
  occupationInfo: {
    occupation: String,
    employer: String,
    officeAddress: String
  },
  
  // Military Training
  militaryTraining: [{
    name: String,
    authority: String,
    dateCompleted: String
  }],
  
  // Special Skills
  specialSkills: [String],
  
  // Awards
  awards: [{
    title: String,
    authority: String,
    dateAwarded: String
  }],
  
  // Assignments
  assignments: [{
    authority: String,
    dateFrom: String,
    dateTo: String
  }],
  
  // Form completion tracking
  sectionCompletion: {
    personalInfo: {
      type: Boolean,
      default: false
    },
    contactInfo: {
      type: Boolean,
      default: false
    },
    identificationInfo: {
      type: Boolean,
      default: false
    },
    educationalBackground: {
      type: Boolean,
      default: false
    },
    occupationInfo: {
      type: Boolean,
      default: false
    },
    militaryTraining: {
      type: Boolean,
      default: false
    }
  },
  
  // Profile Photo (stored as file reference)
  photoUrl: String,
  
  // Signature (stored as file reference)
  signatureUrl: String,
  
  // Attesting Personnel (The officer who validated the form)
  attestingPersonnel: {
    name: String,
    rank: String,
    position: String,
    date: Date
  }
}, {
  timestamps: true
});

// Create and export the model
const RIDS = mongoose.models.RIDS || mongoose.model('RIDS', RIDSSchema);

export default RIDS; 