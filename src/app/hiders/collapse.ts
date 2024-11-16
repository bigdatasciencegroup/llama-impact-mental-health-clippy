// Global registry to track all active clips
const clipRegistry = new Map<HTMLElement, {
  clipButton: HTMLElement;
  updatePosition: () => void;
}>();

interface ClipCollapseOptions {
  clipSize?: string;
  blurAmount?: string;
  animationDuration?: string;
  collapsedHeight?: string;
  zIndex?: number;
}

function createClipCollapse(
  element: HTMLElement,
  options: ClipCollapseOptions = {}
): () => void {
  const {
    clipSize = '1.5rem',
    blurAmount = '5px',
    animationDuration = '0.3s',
    collapsedHeight = '10px',
    zIndex = 9999
  } = options;

  // Store original styles
  const originalStyles = {
    height: element.style.height,
    transition: element.style.transition,
    overflow: element.style.overflow,
    filter: element.style.filter,
  };

  // Set initial element styles
  Object.assign(element.style, {
    height: collapsedHeight,
    overflow: 'hidden',
    transition: `height ${animationDuration}, filter ${animationDuration}, -webkit-filter ${animationDuration}`,
    filter: `blur(${blurAmount})`,
    WebkitFilter: `blur(${blurAmount})` // Safari support
  });

  // Create clip button
  const clipButton = document.createElement('div');
  Object.assign(clipButton.style, {
    position: 'fixed',
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
    zIndex: zIndex.toString()
  });
  clipButton.textContent = '📎';

  // Add clip button to document body
  document.body.appendChild(clipButton);

  // Function to update position of this clip
  const updatePosition = () => {
    const rect = element.getBoundingClientRect();
    Object.assign(clipButton.style, {
      top: `${rect.top - 8}px`,
      left: `${rect.left - 8}px`
    });
  };

  // Function to update all registered clips
  const updateAllClips = () => {
    clipRegistry.forEach(clip => clip.updatePosition());
  };

  // Track state
  let isCollapsed = true;
  const fullHeight = `${element.scrollHeight}px`;

  // Toggle function
  const toggleCollapse = () => {
    isCollapsed = !isCollapsed;

    if (isCollapsed) {
      element.style.height = collapsedHeight;
      element.style.filter = `blur(${blurAmount})`;
      clipButton.style.transform = 'rotate(0deg)';
    } else {
      element.style.height = fullHeight;
      element.style.filter = 'blur(0)';
      clipButton.style.transform = 'rotate(-45deg)';
    }

    // Update all clips after height change
    setTimeout(updateAllClips, parseFloat(animationDuration) * 1000);
  };

  // Create mutation observer to watch for position changes
  const observer = new MutationObserver(() => {
    updatePosition();
    // Small delay to catch any subsequent layout changes
    setTimeout(updatePosition, 50);
  });

  // Watch for changes that might affect position
  observer.observe(element, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true
  });

  // Also watch the parent element for changes
  if (element.parentElement) {
    observer.observe(element.parentElement, {
      attributes: true,
      childList: true,
      subtree: false,
      characterData: true
    });
  }

  // Add event listeners
  clipButton.addEventListener('click', toggleCollapse);
  window.addEventListener('scroll', updateAllClips);
  window.addEventListener('resize', updateAllClips);

  // Add to registry
  clipRegistry.set(element, {
    clipButton,
    updatePosition
  });

  // Initial position update
  updatePosition();

  // Return cleanup function
  return () => {
    // Restore original styles
    Object.assign(element.style, originalStyles);

    // Remove clip button
    document.body.removeChild(clipButton);

    // Remove event listeners
    clipButton.removeEventListener('click', toggleCollapse);
    window.removeEventListener('scroll', updateAllClips);
    window.removeEventListener('resize', updateAllClips);

    // Disconnect observer
    observer.disconnect();

    // Remove from registry
    clipRegistry.delete(element);
  };
}

// Example usage in Chrome extension content script:
/*
// Create clip collapse
const cleanup = createClipCollapse(document.querySelector('.target-element'), {
  clipSize: '1.5rem',
  blurAmount: '8px',
  animationDuration: '0.4s',
  collapsedHeight: '12px',
  zIndex: 10000
});

// Remove clip collapse when needed
cleanup();
*/

export { createClipCollapse, ClipCollapseOptions };