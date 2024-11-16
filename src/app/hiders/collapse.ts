interface ClipCollapseOptions {
  clipSize?: string;  // Size of the paperclip emoji (default: '1.5rem')
  blurAmount?: string;  // Amount of blur (default: '5px')
  overlayColor?: string;  // Color of blur overlay (default: 'rgba(255, 255, 255, 0.8)')
  animationDuration?: string;  // Duration of animations (default: '0.3s')
  collapsedHeight?: string;  // Height when collapsed (default: '10px')
  zIndex?: number;  // Base z-index (default: 9999)
}

function createClipCollapse(
  element: HTMLElement,
  options: ClipCollapseOptions = {}
): () => void {
  const {
    clipSize = '1.5rem',
    blurAmount = '5px',
    overlayColor = 'rgba(255, 255, 255, 0.8)',
    animationDuration = '0.3s',
    collapsedHeight = '10px',
    zIndex = 9999
  } = options;

  // Store original styles
  const originalStyles = {
    height: element.style.height,
    transition: element.style.transition,
    overflow: element.style.overflow
  };

  // Set initial element styles
  element.style.height = collapsedHeight;
  element.style.overflow = 'hidden';
  element.style.transition = `height ${animationDuration}`;

  // Create blur overlay
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed', // Changed to fixed
    backgroundColor: overlayColor,
    backdropFilter: `blur(${blurAmount})`,
    WebkitBackdropFilter: `blur(${blurAmount})`, // Safari support
    transition: `opacity ${animationDuration}`,
    pointerEvents: 'none',
    zIndex: zIndex.toString()
  });

  // Create clip button
  const clipButton = document.createElement('div');
  Object.assign(clipButton.style, {
    position: 'fixed', // Changed to fixed
    fontSize: clipSize,
    cursor: 'pointer',
    transform: 'rotate(0deg)',
    transition: `transform ${animationDuration}`,
    userSelect: 'none',
    width: clipSize,
    height: clipSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: (zIndex + 1).toString()
  });
  clipButton.textContent = '📎';

  // Add elements to document body
  document.body.appendChild(overlay);
  document.body.appendChild(clipButton);

  // Function to update positions
  const updatePositions = () => {
    const rect = element.getBoundingClientRect();

    // Position overlay
    Object.assign(overlay.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });

    // Position clip button
    Object.assign(clipButton.style, {
      top: `${rect.top - 8}px`,
      left: `${rect.left - 8}px`
    });
  };

  // Track state
  let isCollapsed = true;
  const fullHeight = `${element.scrollHeight}px`;

  // Toggle function
  const toggleCollapse = () => {
    isCollapsed = !isCollapsed;

    if (isCollapsed) {
      element.style.height = collapsedHeight;
      overlay.style.opacity = '1';
      clipButton.style.transform = 'rotate(0deg)';
    } else {
      element.style.height = fullHeight;
      overlay.style.opacity = '0';
      clipButton.style.transform = 'rotate(-45deg)';
    }

    // Update positions after height change
    setTimeout(updatePositions, parseFloat(animationDuration) * 1000);
  };

  // Add event listeners
  clipButton.addEventListener('click', toggleCollapse);
  window.addEventListener('scroll', updatePositions);
  window.addEventListener('resize', updatePositions);

  // Initial position update
  updatePositions();

  // Return cleanup function
  return () => {
    // Restore original styles
    Object.assign(element.style, originalStyles);

    // Remove added elements
    document.body.removeChild(overlay);
    document.body.removeChild(clipButton);

    // Remove event listeners
    clipButton.removeEventListener('click', toggleCollapse);
    window.removeEventListener('scroll', updatePositions);
    window.removeEventListener('resize', updatePositions);
  };
}

export { createClipCollapse, ClipCollapseOptions };