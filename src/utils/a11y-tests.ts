/**
 * Accessibility (a11y) Testing Utilities
 * 
 * This file contains utilities to help with testing accessibility compliance in components.
 * It's designed to be used with testing libraries like Jest and Testing Library.
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { render, RenderResult } from '@testing-library/react';

// Add custom jest matchers
expect.extend(toHaveNoViolations);

/**
 * Tests a component for accessibility violations using axe
 * 
 * @param ui - The component to test
 * @param options - Options for the axe test
 * @returns The render result and axe results
 * 
 * Example usage:
 * ```
 * test('Component passes accessibility tests', async () => {
 *   const { results } = await testA11y(<MyComponent />);
 *   expect(results).toHaveNoViolations();
 * });
 * ```
 */
export async function testA11y(
  ui: React.ReactElement,
  options?: {
    axeOptions?: Parameters<typeof axe>[1];
  }
): Promise<{ container: HTMLElement; results: Awaited<ReturnType<typeof axe>>; renderResult: RenderResult }> {
  const renderResult = render(ui);
  const axeResults = await axe(renderResult.container, options?.axeOptions);

  return {
    container: renderResult.container,
    results: axeResults,
    renderResult,
  };
}

/**
 * Checks that a component has proper keyboard navigation
 * 
 * @param container - The container element
 * @returns boolean indicating if the component has proper tab indices
 */
export function checkKeyboardNavigation(container: HTMLElement): boolean {
  // Check for negative tabIndex (which prevents focusing)
  const elementsWithNegativeTabIndex = Array.from(
    container.querySelectorAll('[tabindex]')
  ).filter((el) => parseInt((el as HTMLElement).getAttribute('tabindex') || '0', 10) < 0);

  // Check for interactive elements without keyboard access
  const interactiveElementsWithoutKeyboardAccess = Array.from(
    container.querySelectorAll('div[onclick], span[onclick]')
  ).filter((el) => !(el as HTMLElement).getAttribute('tabindex'));

  // Return true if no issues found
  return elementsWithNegativeTabIndex.length === 0 && interactiveElementsWithoutKeyboardAccess.length === 0;
}

/**
 * Checks that all images have alt text
 * 
 * @param container - The container element
 * @returns boolean indicating if all images have alt text
 */
export function checkImagesHaveAltText(container: HTMLElement): boolean {
  const images = Array.from(container.querySelectorAll('img'));
  const imagesWithoutAlt = images.filter((img) => !img.hasAttribute('alt'));
  
  return imagesWithoutAlt.length === 0;
}

/**
 * Checks that all form controls have associated labels
 * 
 * @param container - The container element
 * @returns boolean indicating if all form controls have labels
 */
export function checkFormControlsHaveLabels(container: HTMLElement): boolean {
  const formControls = Array.from(
    container.querySelectorAll('input, select, textarea')
  );
  
  const controlsWithoutLabels = formControls.filter((control) => {
    const id = control.getAttribute('id');
    // No id means no label association possible
    if (!id) return true;
    
    // Check for associated label
    const hasLabel = container.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = control.hasAttribute('aria-label');
    const hasAriaLabelledBy = control.hasAttribute('aria-labelledby');
    
    return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
  });
  
  return controlsWithoutLabels.length === 0;
}

/**
 * Checks for proper heading hierarchy
 * 
 * @param container - The container element
 * @returns boolean indicating if the heading hierarchy is proper
 */
export function checkHeadingHierarchy(container: HTMLElement): boolean {
  const headings = Array.from(
    container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  );
  
  let previousLevel = 0;
  let hasError = false;
  
  headings.forEach((heading) => {
    const currentLevel = parseInt(heading.tagName.charAt(1), 10);
    
    // First heading can be any level
    if (previousLevel === 0) {
      previousLevel = currentLevel;
      return;
    }
    
    // Heading levels should not skip (e.g., h2 to h4)
    if (currentLevel > previousLevel && currentLevel - previousLevel > 1) {
      hasError = true;
    }
    
    previousLevel = currentLevel;
  });
  
  return !hasError;
}

/**
 * Checks for proper use of ARIA roles
 * 
 * @param container - The container element
 * @returns boolean indicating if ARIA roles are used properly
 */
export function checkAriaRoles(container: HTMLElement): boolean {
  // Some common mistakes with ARIA roles
  const invalidRoleCombinations = [
    'button[role="link"]',
    'a[role="button"]:not([href])',
    '[role="heading"]:not([aria-level])',
  ];
  
  // Check for any invalid combinations
  const hasInvalidRoles = invalidRoleCombinations.some((selector) => {
    return container.querySelector(selector) !== null;
  });
  
  return !hasInvalidRoles;
}

/**
 * Run all accessibility checks on a container
 * 
 * @param container - The container element
 * @returns Object with results of all checks
 */
export function runAllA11yChecks(container: HTMLElement): {
  keyboardNavigation: boolean;
  imagesHaveAltText: boolean;
  formControlsHaveLabels: boolean;
  headingHierarchy: boolean;
  ariaRoles: boolean;
  allPassed: boolean;
} {
  const keyboardNavigation = checkKeyboardNavigation(container);
  const imagesHaveAltText = checkImagesHaveAltText(container);
  const formControlsHaveLabels = checkFormControlsHaveLabels(container);
  const headingHierarchy = checkHeadingHierarchy(container);
  const ariaRoles = checkAriaRoles(container);
  
  const allPassed = 
    keyboardNavigation && 
    imagesHaveAltText && 
    formControlsHaveLabels && 
    headingHierarchy && 
    ariaRoles;
  
  return {
    keyboardNavigation,
    imagesHaveAltText,
    formControlsHaveLabels,
    headingHierarchy,
    ariaRoles,
    allPassed,
  };
} 