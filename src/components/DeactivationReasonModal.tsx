"use client";

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DeactivationReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  userName: string;
}

const DeactivationReasonModal: React.FC<DeactivationReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When the modal opens, reset the form state
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Trim the reason and ensure it's not empty
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      console.error('DeactivationReasonModal: Attempted submission with empty reason');
      setIsSubmitting(false);
      return;
    }
    
    console.log(`DeactivationReasonModal: Submitting reason for ${userName}: "${trimmedReason}"`);
    
    // Store in localStorage as a backup in case sessionStorage fails
    try {
      localStorage.setItem('lastDeactivationReason', trimmedReason);
      console.log('DeactivationReasonModal: Stored reason in localStorage as backup');
    } catch (error) {
      console.error('DeactivationReasonModal: Failed to store in localStorage:', error);
    }
    
    // Add a small delay to show loading state
    setTimeout(() => {
      try {
        // Pass the trimmed reason to the confirm handler
        onConfirm(trimmedReason);
        console.log(`DeactivationReasonModal: Successfully passed reason to parent`);
      } catch (error) {
        console.error('DeactivationReasonModal: Error in onConfirm handler:', error);
      } finally {
        setReason('');
        setIsSubmitting(false);
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Account Deactivation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              You are about to deactivate <span className="font-medium">{userName}</span>'s account. 
              Please provide a reason for this action.
            </p>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for deactivation:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              placeholder="Enter reason for deactivation..."
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Deactivating...' : 'Deactivate Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeactivationReasonModal; 