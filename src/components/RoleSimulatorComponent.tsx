'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/personnel';
import Button from './Button';

export default function RoleSimulatorComponent() {
  const { user, simulateRole } = useAuth();
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Reset active role when user changes
    if (user) {
      setActiveRole(user.role);
    }
  }, [user]);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    simulateRole(role);
  };

  const roles: UserRole[] = ['RESERVIST', 'STAFF', 'ADMIN', 'DIRECTOR'];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Current User: {user?.name}</p>
        <p className="text-sm font-medium text-gray-700 mb-2">Actual Role: {user?.role}</p>
        {activeRole !== user?.role && (
          <p className="text-sm font-medium text-blue-700 mb-2">
            Simulated Role: {activeRole}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <Button
            key={role}
            size="sm"
            variant={activeRole === role ? "primary" : "secondary"}
            onClick={() => handleRoleChange(role)}
          >
            {role}
          </Button>
        ))}
      </div>

      {activeRole !== user?.role && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> You are currently simulating the {activeRole} role. 
            Your actual role is {user?.role}. This simulation affects only the UI and permissions in this session.
          </p>
        </div>
      )}
    </div>
  );
} 