interface BlurOptions {
  blurAmount?: string;  // CSS blur value (default: '5px')
  transitionDuration?: string;  // Duration of blur animation (default: '0.3s')
}

export function createBlurOverlay(
  element: HTMLElement,
  options: BlurOptions = {}
): () => void {
  // Default options
  const {
    blurAmount = '5px',
    transitionDuration = '0.3s'
  } = options;

  // Store original element styles
  const originalFilter = element.style.filter;
  const originalTransition = element.style.transition;

  console.log('Creating blur overlay for element:', element);
  // Set element styles
  element.style.filter = `blur(${blurAmount})`;
  element.style.transition = `filter ${transitionDuration}`;

  // Return cleanup function
  return () => {
    // Restore original styles
    element.style.backdropFilter = originalFilter;
    element.style.transition = originalTransition;
  };
}
