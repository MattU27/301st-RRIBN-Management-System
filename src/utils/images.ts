// Image asset paths
export const IMAGES = {
  // Logo & Branding
  AFP_SEAL: '/images/laang-kawal.png',
  
  // Hero Images
  HERO_BATTALION: '/images/AFP.png',
  TEAM_12IB: '/images/team12ib.jpg',
  
  // Fallback Images
  FALLBACK_HERO: 'https://i.imgur.com/6tV1eky.jpg',
  
  // Other Assets
  PHILIPPINE_FLAG: '/images/philippine_flag.png',
};

/**
 * Gets image URL with fallback
 * @param primarySrc Primary image source
 * @param fallbackSrc Fallback image source if primary fails
 * @returns Object with src and onError handler
 */
export const getImageWithFallback = (primarySrc: string, fallbackSrc: string) => {
  return {
    src: primarySrc,
    onError: `this.onerror=null; this.src='${fallbackSrc}';`
  };
};

export default IMAGES; 