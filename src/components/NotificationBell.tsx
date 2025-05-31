"use client";

import { useRef } from 'react';

// Empty notification bell component - notifications removed for all user roles
export default function NotificationBell() {
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden/disabled bell icon */}
      <div className="hidden">
        {/* Bell icon intentionally hidden */}
      </div>
    </div>
  );
} 