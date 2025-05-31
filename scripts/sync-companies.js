// This script triggers the company sync API endpoint

const axios = require('axios');
require('dotenv').config();

// Environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_TOKEN = process.env.API_TOKEN; // Admin API token

async function main() {
  if (!API_TOKEN) {
    console.error('Error: API_TOKEN environment variable is not set.');
    console.log('Please set an admin API token in your .env file:');
    console.log('API_TOKEN=your_admin_jwt_token');
    process.exit(1);
  }

  try {
    console.log('Triggering company sync via API...');
    
    const response = await axios.post(`${API_URL}/api/companies/sync`, {}, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ ' + response.data.message);
    } else {
      console.error('❌ Sync failed:', response.data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error syncing companies:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 401) {
      console.log('Authentication failed. Make sure your API_TOKEN is valid and has admin privileges.');
    } else if (error.response?.status === 403) {
      console.log('Authorization failed. Your API token does not have sufficient permissions.');
    }
  }
}

main().catch(console.error); 