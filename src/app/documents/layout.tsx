"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DocumentTextIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
} 