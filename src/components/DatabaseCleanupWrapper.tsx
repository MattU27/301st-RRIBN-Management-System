"use client";

import dynamic from 'next/dynamic';

// Dynamically import the DatabaseCleanupInit component with ssr: false
const DatabaseCleanupInit = dynamic(
  () => import('@/components/DatabaseCleanupInit'),
  { ssr: false }
);

export default function DatabaseCleanupWrapper() {
  return <DatabaseCleanupInit />;
} 