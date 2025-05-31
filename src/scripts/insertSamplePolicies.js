// Script to insert sample policy documents into MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Define the database connection URI
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

// Define policy status and category enums
const PolicyStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

const PolicyCategory = {
  OPERATIONS: 'Operations',
  SAFETY: 'Safety',
  HR: 'HR',
  FINANCE: 'Finance',
  SECURITY: 'Security',
  COMPLIANCE: 'Compliance',
  TRAINING: 'Training',
  GENERAL: 'General'
};

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Define the Policy schema
const policySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    content: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: Object.values(PolicyCategory),
      required: true
    },
    version: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(PolicyStatus),
      default: PolicyStatus.DRAFT
    },
    effectiveDate: {
      type: Date,
      required: true
    },
    expirationDate: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
policySchema.index({ status: 1 });
policySchema.index({ category: 1 });
policySchema.index({ effectiveDate: 1 });
policySchema.index({ title: 1, version: 1 }, { unique: true });

// Create Policy model
const Policy = mongoose.model('Policy', policySchema);

// Sample policies to insert
const samplePolicies = [
  {
    title: 'Standard Operating Procedures',
    description: 'Outlines standard procedures for daily operations',
    content: '# Standard Operating Procedures\n\n## Overview\nThis document outlines the standard operating procedures for all daily operations within the organization.\n\n## Procedures\n1. Morning reporting\n2. Equipment checks\n3. Communication protocols\n4. Evening reporting',
    category: PolicyCategory.OPERATIONS,
    version: '1.2',
    status: PolicyStatus.PUBLISHED,
    effectiveDate: new Date('2023-10-15'),
    createdBy: new ObjectId('6406473b18c35a9b9c26e756'), // Replace with an actual user ID from your database
    createdAt: new Date('2023-09-15T10:00:00Z'),
    updatedAt: new Date('2023-09-15T10:00:00Z')
  },
  {
    title: 'Emergency Response Protocol',
    description: 'Procedures to follow in emergency situations',
    content: '# Emergency Response Protocol\n\n## Overview\nThis document outlines the procedures to follow in various emergency situations.\n\n## Emergency Types\n1. Natural disasters\n2. Medical emergencies\n3. Security breaches\n4. Equipment failures',
    category: PolicyCategory.SAFETY,
    version: '2.1',
    status: PolicyStatus.PUBLISHED,
    effectiveDate: new Date('2023-11-01'),
    createdBy: new ObjectId('6406473b18c35a9b9c26e756'), // Replace with an actual user ID from your database
    createdAt: new Date('2023-10-01T14:30:00Z'),
    updatedAt: new Date('2023-10-15T09:45:00Z')
  },
  {
    title: 'Personnel Leave Policy',
    description: 'Guidelines for requesting and approving leave',
    content: '# Personnel Leave Policy\n\n## Overview\nThis document outlines the guidelines for requesting and approving personnel leave.\n\n## Leave Types\n1. Annual leave\n2. Sick leave\n3. Emergency leave\n4. Training leave',
    category: PolicyCategory.HR,
    version: '1.0',
    status: PolicyStatus.DRAFT,
    effectiveDate: new Date('2024-01-01'),
    createdBy: new ObjectId('6406473b18c35a9b9c26e756'), // Replace with an actual user ID from your database
    createdAt: new Date('2023-11-10T11:20:00Z'),
    updatedAt: new Date('2023-11-10T11:20:00Z')
  },
  {
    title: 'Equipment Maintenance Guidelines',
    description: 'Procedures for regular equipment maintenance',
    content: '# Equipment Maintenance Guidelines\n\n## Overview\nThis document outlines the procedures for regular equipment maintenance.\n\n## Maintenance Schedule\n1. Daily checks\n2. Weekly maintenance\n3. Monthly inspections\n4. Quarterly overhauls',
    category: PolicyCategory.OPERATIONS,
    version: '1.5',
    status: PolicyStatus.ARCHIVED,
    effectiveDate: new Date('2022-06-01'),
    expirationDate: new Date('2023-06-01'),
    createdBy: new ObjectId('6406473b18c35a9b9c26e756'), // Replace with an actual user ID from your database
    createdAt: new Date('2022-05-15T13:40:00Z'),
    updatedAt: new Date('2023-06-02T10:15:00Z')
  },
  {
    title: 'Data Security Policy',
    description: 'Guidelines for maintaining data security',
    content: '# Data Security Policy\n\n## Overview\nThis document outlines the guidelines for maintaining data security across all systems.\n\n## Security Measures\n1. Password requirements\n2. Data encryption\n3. Access control\n4. Incident reporting',
    category: PolicyCategory.SECURITY,
    version: '2.0',
    status: PolicyStatus.PUBLISHED,
    effectiveDate: new Date('2023-09-01'),
    createdBy: new ObjectId('6406473b18c35a9b9c26e756'), // Replace with an actual user ID from your database
    createdAt: new Date('2023-08-15T09:30:00Z'),
    updatedAt: new Date('2023-08-20T14:15:00Z')
  }
];

// Function to insert sample policies
async function insertSamplePolicies() {
  try {
    await connectToDatabase();
    
    // Check if there are already policies in the database
    const existingCount = await Policy.countDocuments();
    console.log(`Found ${existingCount} existing policies`);
    
    // Clear existing policies for a fresh start
    await Policy.deleteMany({});
    console.log('Cleared existing policies');
    
    // Insert the sample policies
    const result = await Policy.insertMany(samplePolicies);
    console.log(`Successfully inserted ${result.length} sample policies:`);
    result.forEach(policy => {
      console.log(`- ${policy.title} (${policy._id})`);
    });
  } catch (error) {
    console.error('Error inserting sample policies:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Execute the function
insertSamplePolicies(); 