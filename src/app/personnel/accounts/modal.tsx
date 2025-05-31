'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  UserCircleIcon, 
  XMarkIcon,
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ConfirmationDialog from '@/components/ConfirmationDialog';

// Interface for account request
interface AccountRequest {
  id: string;
  name: string;
  email: string;
  rank: string;
  company: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ApproveAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApproveAccountsModal({ isOpen, onClose }: ApproveAccountsModalProps) {
  const [accounts, setAccounts] = useState<AccountRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<AccountRequest | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<'approve' | 'reject' | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Mock accounts data (will be replaced with API call)
  const MOCK_ACCOUNTS: AccountRequest[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@army.mil.ph',
      rank: 'Private First Class',
      company: 'Alpha',
      submittedAt: '2024-04-01T10:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@army.mil.ph',
      rank: 'Corporal',
      company: 'Bravo',
      submittedAt: '2024-04-02T08:15:00Z',
      status: 'pending'
    },
    {
      id: '3',
      name: 'Michael Davis',
      email: 'michael.davis@army.mil.ph',
      rank: 'Sergeant',
      company: 'Charlie',
      submittedAt: '2024-04-02T14:45:00Z',
      status: 'pending'
    },
    {
      id: '4',
      name: 'Lisa Wilson',
      email: 'lisa.wilson@army.mil.ph',
      rank: 'Staff Sergeant',
      company: 'Headquarters',
      submittedAt: '2024-04-03T09:20:00Z',
      status: 'pending'
    }
  ];

  // Fetch account data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAccountsData();
    }
  }, [isOpen]);

  const fetchAccountsData = async () => {
    setLoading(true);
    try {
      // Call the API to get account requests - direct from MongoDB
      const response = await fetch('/api/personnel/accounts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch account data');
      }
      
      // Use real data from MongoDB
      setAccounts(data.accounts || []);
      
      // Debug: log the accounts data
      console.log('Fetched accounts:', data.accounts);
    } catch (error) {
      console.error('Error fetching accounts data:', error);
      toast.error('Failed to load account requests. Please try again.');
      // Do not fall back to mock data - show empty state instead
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAccount = async (account: AccountRequest) => {
    setSelectedAccount(account);
    setConfirmationAction('approve');
    setShowConfirmation(true);
  };

  const handleRejectAccount = async (account: AccountRequest) => {
    setSelectedAccount(account);
    setShowRejectionModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedAccount) return;
    
    setShowConfirmation(false);
    
    try {
      const response = await fetch('/api/personnel/accounts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: selectedAccount.id,
          status: 'approved' as const
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve account');
      }
      
      // Update the local state
      const updatedAccounts = accounts.map(acc => 
        acc.id === selectedAccount.id ? { ...acc, status: 'approved' as const } : acc
      );
      
      setAccounts(updatedAccounts);
      toast.success(`Account for ${selectedAccount.name} approved successfully`);
    } catch (error) {
      console.error('Error approving account:', error);
      toast.error('Failed to approve account');
    }
  };

  const confirmReject = async () => {
    if (!selectedAccount) return;
    
    setShowRejectionModal(false);
    
    try {
      const response = await fetch('/api/personnel/accounts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: selectedAccount.id,
          status: 'rejected' as const,
          rejectionReason
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject account');
      }
      
      // Update the local state
      const updatedAccounts = accounts.map(acc => 
        acc.id === selectedAccount.id ? { ...acc, status: 'rejected' as const } : acc
      );
      
      setAccounts(updatedAccounts);
      toast.success(`Account for ${selectedAccount.name} rejected`);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting account:', error);
      toast.error('Failed to reject account');
    }
  };

  const filteredAccounts = accounts.filter(account => {
    if (filterStatus === 'all') return true;
    return account.status === filterStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[90vw] max-h-[85vh] flex flex-col">
                  <div className="absolute right-0 top-0 pr-4 pt-4 block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="bg-white p-4 sm:p-5 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-start">
                      <div className="mt-0 w-full">
                        <div>
                          <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                            <UserCircleIcon className="h-5 w-5 mr-2 text-indigo-600" />
                            Approve Personnel Accounts
                          </Dialog.Title>
                          <p className="text-sm text-gray-500 mt-1">Review and manage personnel account requests</p>
                        </div>
                        
                        <div className="mt-3">
                          {/* Filter options */}
                          <div className="mb-3 flex justify-between items-center">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setFilterStatus('pending')}
                                className={`px-3 py-1 text-sm font-medium rounded-full ${
                                  filterStatus === 'pending' 
                                    ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-400' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Pending
                              </button>
                              <button
                                onClick={() => setFilterStatus('approved')}
                                className={`px-3 py-1 text-sm font-medium rounded-full ${
                                  filterStatus === 'approved' 
                                    ? 'bg-green-100 text-green-800 ring-1 ring-green-400' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Approved
                              </button>
                              <button
                                onClick={() => setFilterStatus('rejected')}
                                className={`px-3 py-1 text-sm font-medium rounded-full ${
                                  filterStatus === 'rejected' 
                                    ? 'bg-red-100 text-red-800 ring-1 ring-red-400' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Rejected
                              </button>
                              <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-3 py-1 text-sm font-medium rounded-full ${
                                  filterStatus === 'all' 
                                    ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                All
                              </button>
                            </div>
                            <button
                              onClick={fetchAccountsData}
                              className="px-3 py-1 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md flex items-center text-sm font-medium"
                            >
                              <ArrowPathIcon className="h-4 w-4 mr-1" />
                              Refresh
                            </button>
                          </div>
                          
                          {/* Accounts table */}
                          <div className="flex-1 overflow-hidden flex flex-col">
                            {loading ? (
                              <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-r-2 border-indigo-600"></div>
                              </div>
                            ) : filteredAccounts.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                                <UserCircleIcon className="h-12 w-12 text-gray-300 mx-auto" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No account requests</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  {filterStatus === 'pending' 
                                    ? 'There are no pending account requests to review.' 
                                    : `No ${filterStatus} accounts found.`}
                                </p>
                              </div>
                            ) : (
                              <div className="overflow-auto rounded-lg border border-gray-200 flex-1">
                                <table className="w-full divide-y divide-gray-200 table-fixed">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[16%]">
                                        Name
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">
                                        Rank
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[11%]">
                                        Company
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%]">
                                        Email
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[16%]">
                                        Submitted At
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[9%]">
                                        Status
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[19%]">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.map((account, idx) => (
                                      <tr key={account.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                                        <td className="px-3 py-2">
                                          <div className="font-medium text-gray-900">{account.name}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className="text-sm text-gray-500">{account.rank}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className="text-sm text-gray-500">{account.company}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className="text-sm text-gray-500 truncate" title={account.email}>{account.email}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className="text-sm text-gray-500">{formatDate(account.submittedAt)}</div>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {account.status === 'pending' && (
                                            <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                              Pending
                                            </span>
                                          )}
                                          {account.status === 'approved' && (
                                            <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                              Approved
                                            </span>
                                          )}
                                          {account.status === 'rejected' && (
                                            <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                              Rejected
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {account.status === 'pending' && (
                                            <div className="flex gap-1 justify-center items-center">
                                              <button
                                                onClick={() => handleApproveAccount(account)}
                                                className="inline-flex items-center justify-center px-2 py-1 bg-green-100 border border-green-300 rounded-md text-xs font-medium text-green-700 hover:bg-green-200 w-20"
                                              >
                                                Approve
                                              </button>
                                              <button
                                                onClick={() => handleRejectAccount(account)}
                                                className="inline-flex items-center justify-center px-2 py-1 bg-red-100 border border-red-300 rounded-md text-xs font-medium text-red-700 hover:bg-red-200 w-20"
                                              >
                                                Reject
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Pagination controls */}
                        {filteredAccounts.length > 0 && (
                          <div className="mt-3 flex justify-center">
                            <nav className="flex items-center gap-1" aria-label="Pagination">
                              <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-2 py-1.5 rounded-md border ${
                                  currentPage === 1 
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                                aria-label="Previous page"
                              >
                                <span className="sr-only">Previous</span>
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <div className="relative inline-flex items-center px-3 py-1.5 border border-indigo-500 bg-indigo-50 text-sm font-medium text-indigo-600 rounded-md">
                                {currentPage}
                              </div>
                              <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className={`relative inline-flex items-center px-2 py-1.5 rounded-md border ${
                                  currentPage === totalPages 
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                                aria-label="Next page"
                              >
                                <span className="sr-only">Next</span>
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <span className="ml-2 text-sm text-gray-600">
                                Page {currentPage} of {totalPages || 1}
                              </span>
                            </nav>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmApprove}
        title="Confirm Account Action"
        message={`Are you sure you want to ${confirmationAction === 'approve' ? 'approve' : 'reject'} the account request for ${selectedAccount?.name}?`}
        confirmText={confirmationAction === 'approve' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        type="warning"
      />
      
      {/* Rejection Reason Dialog */}
      <Transition.Root show={showRejectionModal} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setShowRejectionModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                      <XCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Reject Account Request
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Please provide a reason for rejecting {selectedAccount?.name}'s account request.
                        </p>
                        <textarea
                          className="mt-3 w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                          rows={4}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter rejection reason..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:col-start-2"
                      onClick={confirmReject}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                      onClick={() => setShowRejectionModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
} 