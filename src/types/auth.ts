// Define user roles
export enum UserRole {
  RESERVIST = 'reservist',
  ENLISTED = 'enlisted',
  STAFF = 'staff',
  ADMIN = 'administrator',
  ADMINISTRATOR = 'administrator',
  DIRECTOR = 'director',
  // Adding 'admin' as an alias for backward compatibility
  ADMINISTRATOR_ADMIN = 'administrator',
}

// Define user status
export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'deactivated',
  RETIRED = 'retired',
  STANDBY = 'standby',
  READY = 'ready',
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  company?: string;
  rank?: string;
  profileImage?: string;
} 