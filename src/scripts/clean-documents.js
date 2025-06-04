/**
 * Script to clean up documents with John Matthew Banto's ID
 * Run this in the browser console while logged in as an admin/staff
 */
async function cleanupDocuments() {
  try {
    console.log('Starting document cleanup...');
    
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found. Please log in first.');
      return;
    }
    
    // Call the cleanup endpoint
    const response = await fetch('/api/documents/clean-users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Success: ${result.message}`);
      console.log(`Found: ${result.data.totalFound}, Updated: ${result.data.updated}`);
      
      // Reload the page to see the changes
      if (result.data.updated > 0) {
        console.log('Reloading page to see changes...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error running cleanup:', error);
  }
}

// Execute the function
cleanupDocuments(); 