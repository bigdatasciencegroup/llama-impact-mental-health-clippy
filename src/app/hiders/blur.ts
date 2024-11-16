interface BlurOptions {
  blurAmount?: string;  // CSS blur value (default: '5px')
  backgroundColor?: string;  // Background color of overlay (default: 'rgba(255, 255, 255, 0.8)')
  zIndex?: number;  // z-index of the overlay (default: 9999)
  transitionDuration?: string;  // Duration of blur animation (default: '0.3s')
}

function createBlurOverlay(
  element: HTMLElement,
  options: BlurOptions = {}
): () => void {
  // Default options
  const {
    blurAmount = '1px',
    backgroundColor = 'rgba(255, 255, 255, 0.1)',
    zIndex = 9999,
    transitionDuration = '0.3s'
  } = options;

  // Store original element styles
  const originalPosition = element.style.position;
  const originalZIndex = element.style.zIndex;

  // Ensure element has a position context
  if (getComputedStyle(element).position === 'static') {
    element.style.position = 'relative';
  }

  // Create overlay element
  const overlay = document.createElement('div');

  // Set overlay styles
  Object.assign(overlay.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: backgroundColor,
    backdropFilter: `blur(${blurAmount})`,
    WebkitBackdropFilter: `blur(${blurAmount})`, // Safari support
    zIndex: zIndex.toString(),
    transition: `backdrop-filter ${transitionDuration}, -webkit-backdrop-filter ${transitionDuration}`,
    pointerEvents: 'none' // Allow clicking through the overlay
  });

  // Add overlay to element
  element.appendChild(overlay);

  // Return cleanup function
  return () => {
    element.removeChild(overlay);
    element.style.position = originalPosition;
    element.style.zIndex = originalZIndex;
  };
}
