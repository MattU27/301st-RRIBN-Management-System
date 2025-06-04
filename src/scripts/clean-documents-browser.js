/**
 * Script to clean up documents with John Matthew Banto's ID
 * Copy and paste this entire script into your browser console while logged into the admin panel
 */
(async function() {
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
        if (confirm('Documents updated! Reload page to see changes?')) {
          window.location.reload();
        }
      }
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error running cleanup:', error);
  }
})(); 