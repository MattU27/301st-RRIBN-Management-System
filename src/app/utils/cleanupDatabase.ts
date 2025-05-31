import { connectToDatabase } from '../lib/mongodb';

// List of valid companies to keep
const VALID_COMPANIES = [
  'Alpha', 
  'Bravo', 
  'Charlie', 
  'Headquarters', 
  'NERRSC', // NERR-Signal Company
  'NERRFAB' // NERR-Field Artillery Battery
];

/**
 * Cleanup database by removing invalid companies and updating personnel status
 */
export async function cleanupDatabase() {
  const { db } = await connectToDatabase();
  
  try {
    // 1. Remove companies that aren't in the valid list
    const result = await db.collection('companies').deleteMany({
      name: { $nin: VALID_COMPANIES }
    });
    
    console.log(`Removed ${result.deletedCount} invalid companies`);
    
    // 2. Update all personnel status to "Active"
    const personnelResult = await db.collection('personnel').updateMany(
      { status: { $in: ['Standby', 'Retired'] } },
      { $set: { status: 'Active' } }
    );
    
    console.log(`Updated ${personnelResult.modifiedCount} personnel to Active status`);
    
    // 3. Update company statistics
    await updateCompanyStatistics(db);
    
    return {
      success: true,
      message: `Database cleanup complete. Removed ${result.deletedCount} invalid companies and updated ${personnelResult.modifiedCount} personnel to Active status.`
    };
  } catch (error) {
    console.error('Error during database cleanup:', error);
    return {
      success: false,
      message: `Error during database cleanup: ${error.message}`
    };
  }
}

/**
 * Update company statistics based on personnel data
 */
async function updateCompanyStatistics(db) {
  // Get all companies
  const companies = await db.collection('companies').find({}).toArray();
  
  for (const company of companies) {
    // Count personnel in this company
    const personnel = await db.collection('personnel').find({ 
      companyId: company._id.toString() 
    }).toArray();
    
    // Count by status
    const activeCount = personnel.filter(p => p.status === 'Active').length;
    const standbyCount = personnel.filter(p => p.status === 'Standby').length;
    const retiredCount = personnel.filter(p => p.status === 'Retired').length;
    
    // Update company stats
    await db.collection('companies').updateOne(
      { _id: company._id },
      { 
        $set: { 
          personnelCount: personnel.length,
          statistics: {
            active: activeCount,
            standby: standbyCount,
            retired: retiredCount,
            total: personnel.length
          }
        } 
      }
    );
    
    console.log(`Updated statistics for ${company.name}`);
  }
} 