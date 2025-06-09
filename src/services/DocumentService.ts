import axios from 'axios';

/**
 * Service for handling document-related operations
 */
export class DocumentService {
  /**
   * Get all documents for the current user
   */
  static async getAllDocuments() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get('/api/documents/list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Debug response
      console.log('DocumentService API raw response:', response.data);
      
      // Check for serviceNumber in the first document if available
      if (response.data.success && response.data.data.documents.length > 0) {
        const firstDoc = response.data.data.documents[0];
        console.log('First document uploader:', {
          uploadedBy: firstDoc.uploadedBy,
          serviceNumber: firstDoc.uploadedBy?.serviceNumber,
          hasServiceNumber: firstDoc.uploadedBy && 'serviceNumber' in firstDoc.uploadedBy
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }
  
  /**
   * Get document by ID
   */
  static async getDocumentById(id: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`/api/documents/get/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching document ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Update document status (verify/reject)
   */
  static async updateDocumentStatus(id: string, status: 'verified' | 'rejected', comments?: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put('/api/documents/status', {
        id,
        status,
        comments
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating document ${id} status:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a document
   */
  static async deleteDocument(id: string) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.delete(`/api/documents/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Upload a document
   */
  static async uploadDocument(formData: FormData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post('/api/documents/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }
} 