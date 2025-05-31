import { RankType, CompanyType } from '@/types/personnel';

/**
 * Maps abbreviated rank codes to full rank names from the dropdown
 */
export const getRankDisplayName = (rankCode: string): RankType => {
  // Map of abbreviations to full rank names
  const rankMapping: Record<string, RankType> = {
    // Army ranks
    'PVT': 'Private',
    'PFC': 'Private First Class',
    'CPL': 'Corporal',
    'SGT': 'Sergeant',
    'SGM': 'Sergeant',
    'SSG': 'Sergeant',
    'SSGT': 'Sergeant',
    'MSG': 'Sergeant',
    'SFC': 'Sergeant',
    'CSM': 'Sergeant',
    '2LT': 'Second Lieutenant',
    '1LT': 'First Lieutenant',
    'LT': 'Second Lieutenant',
    'CAPT': 'Captain',
    'CPT': 'Captain',
    'MAJ': 'Major',
    'LTC': 'Lieutenant Colonel',
    'COL': 'Colonel',
    'BG': 'Brigadier General',
    'GEN': 'Brigadier General',
    'MG': 'Brigadier General',
    
    // Navy ranks
    'CPO': 'Sergeant',
    'PO1': 'Corporal',
    'PO2': 'Corporal',
    'PO3': 'Private First Class',
    'MCPO': 'Sergeant',
    'SCPO': 'Sergeant',
    'CWO': 'First Lieutenant',
    'WO': 'Second Lieutenant',
    'RADM': 'Colonel',
    
    // Air Force ranks
    'TSG': 'Sergeant',
    'FMCPO': 'Private',
    'ATC': 'Private',
  };

  // If the rank code is in our mapping, return the full rank
  if (rankCode in rankMapping) {
    return rankMapping[rankCode];
  }
  
  // If the rank is already a valid full rank, return it
  const validRanks: RankType[] = [
    'Private',
    'Private First Class',
    'Corporal',
    'Sergeant',
    'Second Lieutenant',
    'First Lieutenant',
    'Captain',
    'Major',
    'Lieutenant Colonel',
    'Colonel',
    'Brigadier General'
  ];
  
  if (validRanks.includes(rankCode as RankType)) {
    return rankCode as RankType;
  }
  
  // Default fallback
  return 'Private';
};

/**
 * Maps company codes to full company names from the dropdown
 * Handles both string-based company names and MongoDB ObjectId references
 */
export const getCompanyDisplayName = (companyValue: any): CompanyType => {
  // If it's not defined, return default
  if (!companyValue) {
    return 'Alpha';
  }
  
  // If it's an object with an _id field (MongoDB document), handle based on name field
  if (typeof companyValue === 'object' && companyValue !== null) {
    // If it's a company object with a name field, use that
    if (companyValue.name) {
      return getCompanyDisplayName(companyValue.name);
    }
    
    // If it has an _id but not a name, use the default
    if (companyValue._id) {
      return 'Alpha';
    }
  }
  
  // Convert to string for consistent handling
  const companyCode = String(companyValue);
  
  // Map of MongoDB ObjectIDs to company names (these need to be maintained as companies are added)
  const companyIdMapping: Record<string, CompanyType> = {
    // Add mappings for specific company IDs
    "67efd5b3c7528c0dfb154430": "NERRFAB (NERR-Field Artillery Battery)",
    "67efd5b3c7528c0dfb154431": "NERRSC (NERR-Signal Company)",
    "67efd5b3c7528c0dfb15442f": "NERRSC (NERR-Signal Company)",
    "67efd5b3c7528c0dfb154432": "Alpha",
    "67efd5b3c7528c0dfb154433": "Bravo",
    "67efd5b3c7528c0dfb154434": "Charlie",
    "67efd5b3c7528c0dfb154435": "Headquarters"
  };
  
  // Check if the companyValue is a MongoDB ObjectID and return the mapped company name
  if (companyIdMapping[companyCode]) {
    return companyIdMapping[companyCode];
  }
  
  // Map of company codes to full company names
  const companyMapping: Record<string, CompanyType> = {
    'HQ': 'Headquarters',
    'FOXTROT': 'Alpha',
    'NERRRSC': 'NERRSC (NERR-Signal Company)',
    'NERRSC': 'NERRSC (NERR-Signal Company)',
    'ENGBAT': 'Alpha',
    'INTELDIV': 'Alpha',
    'MEDCORP': 'Alpha',
    'DELTA': 'Alpha',
    'ECHO': 'Alpha',
    'HOTEL': 'Alpha',
    'NERRFAB': 'NERRFAB (NERR-Field Artillery Battery)',
  };

  // If the company code is in our mapping, return the full company name
  if (companyCode in companyMapping) {
    return companyMapping[companyCode];
  }
  
  // If the company is already a valid full company name, return it
  const validCompanies: CompanyType[] = [
    'Alpha',
    'Bravo',
    'Charlie',
    'Headquarters',
    'NERRSC (NERR-Signal Company)',
    'NERRFAB (NERR-Field Artillery Battery)'
  ];
  
  // Case-insensitive check for valid company names
  for (const validCompany of validCompanies) {
    if (companyCode.toLowerCase() === validCompany.toLowerCase()) {
      return validCompany;
    }
  }
  
  // Default fallback
  return 'Alpha';
}; 