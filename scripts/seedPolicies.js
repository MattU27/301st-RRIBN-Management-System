const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// MongoDB connection string - use from environment variable
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/afp_personnel_db';

// Sample policy data
const policies = [
  {
    title: 'Standard Operating Procedures (SOP)',
    description: 'Outlines standard procedures for daily operations',
    content: '# Standard Operating Procedures\n\n## Overview\nThis document outlines the standard operating procedures for all daily operations within the organization.\n\n## Procedures\n1. Morning reporting\n2. Equipment checks\n3. Communication protocols\n4. Evening reporting',
    category: 'Operations',
    version: '1.3',
    status: 'published',
    effectiveDate: new Date('2023-10-15'),
    createdBy: new ObjectId('60d0fe4f5311236168a109ca'), // Replace with an actual user ID from your database
    createdAt: new Date('2023-09-15T10:00:00Z'),
    updatedAt: new Date('2023-09-15T10:00:00Z')
  },
  {
    title: 'Emergency Response Protocol (ERP)',
    description: 'Procedures to follow in emergency situations',
    content: '# Emergency Response Protocol\n\n## Overview\nThis document outlines the procedures to follow in various emergency situations.\n\n## Emergency Types\n1. Natural disasters\n2. Medical emergencies\n3. Security breaches\n4. Equipment failures',
    category: 'Safety',
    version: '2.2',
    status: 'published',
    effectiveDate: new Date('2023-11-01'),
    createdBy: new ObjectId('60d0fe4f5311236168a109ca'), // Replace with an actual user ID
    createdAt: new Date('2023-10-01T14:30:00Z'),
    updatedAt: new Date('2023-10-15T09:45:00Z')
  },
  {
    title: 'Personnel Leave Policy (PLP)',
    description: 'Guidelines for requesting and approving leave',
    content: '# Personnel Leave Policy\n\n## Overview\nThis document outlines the guidelines for requesting and approving personnel leave.\n\n## Leave Types\n1. Annual leave\n2. Sick leave\n3. Emergency leave\n4. Training leave',
    category: 'HR',
    version: '1.1',
    status: 'draft',
    effectiveDate: new Date('2024-01-01'),
    createdBy: new ObjectId('60d0fe4f5311236168a109ca'), // Replace with an actual user ID
    createdAt: new Date('2023-11-10T11:20:00Z'),
    updatedAt: new Date('2023-11-10T11:20:00Z')
  },
  {
    title: 'Data Security Policy (DSP)',
    description: 'Guidelines for securing and protecting sensitive data',
    content: '# Data Security Policy\n\n## Overview\nThis document outlines the guidelines for securing and protecting sensitive data within the organization.\n\n## Security Measures\n1. Password requirements\n2. Data encryption standards\n3. Access controls\n4. Incident reporting procedures',
    category: 'Security',
    version: '2.1',
    status: 'published',
    effectiveDate: new Date('2023-09-01'),
    createdBy: new ObjectId('60d0fe4f5311236168a109ca'), // Replace with an actual user ID
    createdAt: new Date('2023-08-15T09:30:00Z'),
    updatedAt: new Date('2023-08-20T14:15:00Z')
  },
  {
    title: 'Equipment Maintenance Guidelines (EMG)',
    description: 'Procedures for regular equipment maintenance',
    content: '# Equipment Maintenance Guidelines\n\n## Overview\nThis document outlines the procedures for regular equipment maintenance.\n\n## Maintenance Schedule\n1. Daily checks\n2. Weekly maintenance\n3. Monthly inspections\n4. Quarterly overhauls',
    category: 'Operations',
    version: '1.6',
    status: 'archived',
    effectiveDate: new Date('2022-06-01'),
    expirationDate: new Date('2023-06-01'),
    createdBy: new ObjectId('60d0fe4f5311236168a109ca'), // Replace with an actual user ID
    createdAt: new Date('2022-05-15T13:40:00Z'),
    updatedAt: new Date('2023-06-02T10:15:00Z')
  }
];

async function seedPolicies() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db();
    const policiesCollection = database.collection('policies');
    
    // Check if collection already has data
    const count = await policiesCollection.countDocuments({});
    if (count > 0) {
      console.log(`Policies collection already has ${count} documents. Do you want to add more? (Y/N)`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('> ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          // Insert the new policy documents
          const result = await policiesCollection.insertMany(policies);
          console.log(`${result.insertedCount} policies successfully inserted.`);
        } else {
          console.log('Seed operation canceled.');
        }
        readline.close();
        await client.close();
      });
    } else {
      // If collection is empty, insert the sample data
      const result = await policiesCollection.insertMany(policies);
      console.log(`${result.insertedCount} policies successfully inserted.`);
      await client.close();
    }
    
  } catch (err) {
    console.error('Error seeding policies:', err);
  }
}

// Run the seed function
seedPolicies(); 