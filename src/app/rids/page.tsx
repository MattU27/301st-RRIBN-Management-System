'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RIDSRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/documents/rids');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-700">Redirecting...</h1>
        <p className="mt-2 text-gray-500">Please wait while you are redirected to the RIDS page.</p>
      </div>
    </div>
  );
} 