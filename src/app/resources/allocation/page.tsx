'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function ResourceAllocationPage() {
  const { user, isAuthenticated, hasSpecificPermission } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState([
    { id: 1, name: 'Training Facilities', allocated: 72, total: 100 },
    { id: 2, name: 'Combat Equipment', allocated: 85, total: 100 },
    { id: 3, name: 'Medical Supplies', allocated: 60, total: 100 },
    { id: 4, name: 'Vehicles', allocated: 90, total: 100 },
    { id: 5, name: 'Communication Equipment', allocated: 65, total: 100 }
  ]);

  if (!hasSpecificPermission('manage_resources')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You do not have permission to manage resource allocation.
            </p>
            <div className="mt-6">
              <Button onClick={() => router.push('/dashboard')} variant="secondary">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const handleAllocationChange = (id: number, value: number) => {
    setResources(resources.map(resource => 
      resource.id === id ? { ...resource, allocated: value } : resource
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically make an API call to save the resource allocations
    alert('Resource allocations updated successfully!');
    router.push('/dashboard');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Resource Allocation
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and optimize resource distribution across companies
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {resources.map(resource => (
              <div key={resource.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor={`resource-${resource.id}`} className="block text-sm font-medium text-gray-700">
                    {resource.name}
                  </label>
                  <span className="text-sm text-gray-500">
                    {resource.allocated}% allocated
                  </span>
                </div>
                <input
                  type="range"
                  id={`resource-${resource.id}`}
                  value={resource.allocated}
                  onChange={(e) => handleAllocationChange(resource.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  min="0"
                  max="100"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className={`h-2.5 rounded-full ${
                      resource.allocated > 80 ? 'bg-green-600' : 
                      resource.allocated > 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${resource.allocated}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Allocations
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 