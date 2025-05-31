'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface AccessibleImageProps extends Omit<ImageProps, 'alt'> {
  /**
   * Alt text for the image. Required unless image is decorative.
   * Describes the content and function of the image for screen readers.
   */
  alt?: string;
  
  /**
   * Whether the image is decorative only.
   * Decorative images will have alt="" and aria-hidden="true".
   */
  decorative?: boolean;
  
  /**
   * Optional longer description for complex images.
   * Will be set as aria-describedby pointing to a visually hidden element.
   */
  longDescription?: string;
  
  /**
   * Optional CSS class name for the wrapper div.
   */
  wrapperClassName?: string;
  
  /**
   * Show a descriptive caption below the image.
   */
  caption?: string;

  /**
   * Fallback text to display if image fails to load.
   */
  fallbackText?: string;
  
  /**
   * If true, will highlight images missing alt text (for development only).
   */
  highlightMissingAlt?: boolean;
}

/**
 * AccessibleImage - An enhanced image component that ensures accessibility.
 * 
 * Features:
 * - Enforces proper alt text
 * - Handles decorative images correctly
 * - Supports longer descriptions for complex images
 * - Error handling with fallback text
 * - Optional visible caption
 * 
 * Usage:
 * ```jsx
 * <AccessibleImage 
 *   src="/path/to/image.jpg"
 *   alt="Description of the image"
 *   width={400}
 *   height={300}
 * />
 * 
 * // For decorative images:
 * <AccessibleImage 
 *   src="/path/to/decorative.jpg"
 *   decorative={true}
 *   width={400}
 *   height={300}
 * />
 * ```
 */
const AccessibleImage: React.FC<AccessibleImageProps> = ({
  alt,
  src,
  decorative = false,
  longDescription,
  wrapperClassName = '',
  caption,
  fallbackText = 'Image could not be loaded',
  highlightMissingAlt = false,
  ...props
}) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Generate a unique ID for the long description if provided
  const descriptionId = longDescription ? `img-desc-${Math.random().toString(36).substring(2, 9)}` : undefined;
  
  // Check for missing alt text on non-decorative images
  const isMissingAlt = !decorative && !alt && highlightMissingAlt;
  
  // Handle image load error
  const handleError = () => {
    setError(true);
  };
  
  // Handle image load success
  const handleLoad = () => {
    setLoaded(true);
  };
  
  // Error state - show fallback text
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border border-gray-300 ${wrapperClassName}`}
        style={{ width: props.width, height: props.height }}
        role="img"
        aria-label={fallbackText}
      >
        <p className="text-gray-500 text-center p-4">{fallbackText}</p>
      </div>
    );
  }
  
  return (
    <div className={wrapperClassName}>
      <div className={`relative ${isMissingAlt ? 'border-2 border-red-500' : ''}`}>
        <Image
          src={src}
          alt={decorative ? '' : (alt || 'Image missing alt text')}
          aria-hidden={decorative}
          aria-describedby={descriptionId}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
        
        {/* Development helper to highlight missing alt text */}
        {isMissingAlt && (
          <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs">
            Missing alt text
          </div>
        )}
        
        {/* Loading indicator */}
        {!loaded && !error && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
            aria-hidden="true"
          >
            <div className="animate-pulse h-full w-full bg-gray-200"></div>
          </div>
        )}
      </div>
      
      {/* Visually hidden long description */}
      {longDescription && (
        <div 
          id={descriptionId}
          className="sr-only"
        >
          {longDescription}
        </div>
      )}
      
      {/* Optional visible caption */}
      {caption && (
        <figcaption className="text-sm text-gray-600 mt-2">
          {caption}
        </figcaption>
      )}
    </div>
  );
};

export default AccessibleImage; 