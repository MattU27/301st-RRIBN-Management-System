'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { UserIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface PendingAdmin {
  id: string;
  name: string;
  email: string;
  rank: string;
  serialNumber: string;
  branch: string;
  submittedAt: string;
}

const MOCK_PENDING_ADMINS: PendingAdmin[] = [
  {
    id: '1',
    name: 'LTC James Rodriguez',
    email: 'james.rodriguez@army.mil.ph',
    rank: 'Lieutenant Colonel',
    serialNumber: '301-78901',
    branch: '301st Infantry Brigade',
    submittedAt: '2024-03-15T08:30:00Z'
  },
  {
    id: '2',
    name: 'MAJ Sarah Chen',
    email: 'sarah.chen@army.mil.ph',
    rank: 'Major',
    serialNumber: '301-78902',
    branch: '301st Infantry Brigade',
    submittedAt: '2024-03-14T15:45:00Z'
  }
];

export default function ReviewAdminRegistrationsPage() {
  const router = useRouter();
  const { hasSpecificPermission } = useAuth();
  const [pendingAdmins] = useState<PendingAdmin[]>(MOCK_PENDING_ADMINS);

  if (!hasSpecificPermission('review_admin_registrations')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-lg">
          <div className="text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h2>
            <p className="mt-1 text-sm text-gray-500">
              You do not have permission to review admin registrations.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const handleApprove = (id: string) => {
    // Here you would typically make an API call to approve the admin account
    alert(`Admin account ${id} approved successfully`);
  };

  const handleReject = (id: string) => {
    // Here you would typically make an API call to reject the admin account
    alert(`Admin account ${id} rejected`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Review Admin Registrations</h2>
              <p className="mt-1 text-sm text-gray-500">
                Review and approve pending administrator account registrations.
              </p>
            </div>

            <div className="space-y-6">
              {pendingAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending registrations</p>
                </div>
              ) : (
                pendingAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="bg-white shadow rounded-lg p-6 border border-gray-200"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{admin.name}</h3>
                          <p className="text-sm text-gray-500">{admin.rank}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(admin.id)}
                            className="flex items-center"
                          >
                            <CheckCircleIcon className="h-5 w-5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(admin.id)}
                            className="flex items-center"
                          >
                            <XCircleIcon className="h-5 w-5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-500">Email</p>
                          <p className="text-gray-900">{admin.email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Serial Number</p>
                          <p className="text-gray-900">{admin.serialNumber}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Branch</p>
                          <p className="text-gray-900">{admin.branch}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Submitted</p>
                          <p className="text-gray-900">
                            {new Date(admin.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => router.back()}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 