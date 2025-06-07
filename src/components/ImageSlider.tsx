"use client";

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ImageSliderProps {
  images: string[];
  flippedImages?: string[]; // Array of image paths that should be flipped horizontally
  interval?: number; // Auto-slide interval in milliseconds
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
  imageClassName?: string;
  alt?: string;
}

export default function ImageSlider({
  images,
  flippedImages = [],
  interval = 5000,
  showControls = true,
  showIndicators = true,
  className = "",
  imageClassName = "",
  alt = "Slider image"
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Function to go to the next slide
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  // Function to go to the previous slide
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  // Function to go to a specific slide
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-slide effect
  useEffect(() => {
    if (interval > 0) {
      const timer = setInterval(() => {
        nextSlide();
      }, interval);

      return () => clearInterval(timer);
    }
  }, [currentIndex, interval]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Images */}
      <div className="relative h-full w-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={image}
              alt={`${alt} ${index + 1}`}
              className={`h-full w-full object-cover ${imageClassName} ${flippedImages.includes(image) ? 'scale-x-[-1]' : ''}`}
              onError={(e) => {
                console.error(`Failed to load image: ${image}`);
                e.currentTarget.src = "https://i.imgur.com/6tV1eky.jpg"; // Fallback image
              }}
            />
          </div>
        ))}
      </div>

      {/* Controls/Arrows */}
      {showControls && images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 z-5 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 z-5 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300"
            aria-label="Next slide"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Indicators/Dots */}
      {showIndicators && images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-5 flex justify-center space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 w-8 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-[#D1B000]' : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 