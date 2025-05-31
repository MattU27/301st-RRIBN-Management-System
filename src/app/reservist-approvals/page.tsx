'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface ReservistRequest {
  id: string;
  name: string;
  email: string;
  rank: string;
  serviceNumber: string;
  dateRequested: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function ReservistApprovalsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<ReservistRequest[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch pending reservist requests
  useEffect(() => {
    const fetchReservistRequests = async () => {
      setIsLoading(true);
      try {
        // This would be replaced with an actual API call when implemented
        // For now, using mock data
        const mockRequests: ReservistRequest[] = [
          {
            id: '1',
            name: 'Juan Santos',
            email: 'jsantos@example.com',
            rank: 'Private',
            serviceNumber: 'RS-102938',
            dateRequested: new Date().toLocaleDateString(),
            status: 'pending'
          },
          {
            id: '2',
            name: 'Maria Reyes',
            email: 'mreyes@example.com',
            rank: 'Corporal',
            serviceNumber: 'RS-293847',
            dateRequested: new Date().toLocaleDateString(),
            status: 'pending'
          },
          {
            id: '3',
            name: 'Carlos Bautista',
            email: 'cbautista@example.com',
            rank: 'Sergeant',
            serviceNumber: 'RS-384756',
            dateRequested: new Date().toLocaleDateString(),
            status: 'pending'
          }
        ];
        
        // Simulate API delay
        setTimeout(() => {
          setRequests(mockRequests);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Failed to fetch reservist requests:', error);
        setIsLoading(false);
      }
    };

    fetchReservistRequests();
  }, []);

  // Handle approval of a reservist request
  const handleApprove = async (requestId: string) => {
    try {
      // This would be replaced with an actual API call
      console.log(`Approving request ${requestId}`);
      
      // Update local state to reflect the change
      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: 'approved' } 
            : request
        )
      );
      
      // Show success message
      setToast({
        message: 'Reservist account approved successfully',
        type: 'success'
      });
      
      // Hide toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to approve reservist:', error);
      setToast({
        message: 'Failed to approve reservist account',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Handle rejection of a reservist request
  const handleReject = async (requestId: string) => {
    try {
      // This would be replaced with an actual API call
      console.log(`Rejecting request ${requestId}`);
      
      // Update local state to reflect the change
      setRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status: 'rejected' } 
            : request
        )
      );
      
      // Show success message
      setToast({
        message: 'Reservist account rejected',
        type: 'success'
      });
      
      // Hide toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Failed to reject reservist:', error);
      setToast({
        message: 'Failed to reject reservist account',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Check if user has permission to access this page
  if (!hasPermission('staff')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="p-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Access Denied</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>You don't have permission to access this page.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button
                variant="secondary"
                onClick={() => router.push('/personnel')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Return to Personnel Management
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Approve Reservist Accounts</h1>
          </div>
          <Button
            variant="secondary"
            onClick={() => router.push('/personnel')}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Return to Personnel
          </Button>
        </div>

        <Card>
          <div className="p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Requests</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">No pending reservist account requests</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Number</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.name}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.rank}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.serviceNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.dateRequested}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${request.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : request.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="text-green-600 hover:text-green-900 flex items-center"
                              >
                                <CheckCircleIcon className="h-5 w-5 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <XCircleIcon className="h-5 w-5 mr-1" />
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
        </Card>
      </div>
      
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            ) : (
              <XCircleIcon className="h-5 w-5 mr-2" />
            )}
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 