'use client';

import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  interactive?: boolean;
  onClick?: () => void;
  id?: string;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  headingLevel = 'h2',
  interactive = false,
  onClick,
  id,
}) => {
  // Dynamically create the heading based on the level prop
  const Heading = headingLevel;
  
  // Base classes
  const baseClasses = 'rounded-lg shadow-md bg-white overflow-hidden';
  const hoverClasses = interactive ? 'hover:shadow-lg transition-shadow cursor-pointer' : '';
  const focusClasses = interactive ? 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2' : '';
  
  // If card is interactive, wrap in a button for better accessibility
  if (interactive) {
    return (
      <button
        className={`${baseClasses} ${hoverClasses} ${focusClasses} w-full text-left ${className}`}
        onClick={onClick}
        id={id}
        tabIndex={0}
        aria-labelledby={title ? `${id}-title` : undefined}
      >
        <div className="p-4">
          {title && (
            <Heading id={`${id}-title`} className="text-lg font-medium text-gray-900 mb-2">
              {title}
            </Heading>
          )}
          <div>{children}</div>
        </div>
      </button>
    );
  }
  
  // Otherwise render as a standard div
  return (
    <div className={`${baseClasses} ${className}`} id={id}>
      <div className="p-4">
        {title && (
          <Heading className="text-lg font-medium text-gray-900 mb-2">
            {title}
          </Heading>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Card; 