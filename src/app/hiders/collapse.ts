interface ClipCollapseOptions {
  clipSize?: string;
  blurAmount?: string;
  overlayColor?: string;
  animationDuration?: string;
  collapsedHeight?: string;
  zIndex?: number;
}

const ClipCollapseRegistry = {
  instances: new Set<() => void>(),
  register(updateFn: () => void) {
    this.instances.add(updateFn);
  },
  unregister(updateFn: () => void) {
    this.instances.delete(updateFn);
  },
  updateAll() {
    this.instances.forEach(updateFn => updateFn());
  }
};

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
    position: 'fixed',
    backgroundColor: overlayColor,
    backdropFilter: `blur(${blurAmount})`,
    WebkitBackdropFilter: `blur(${blurAmount})`,
    transition: `opacity ${animationDuration}`,
    pointerEvents: 'none',
    zIndex: zIndex.toString()
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
    zIndex: (zIndex + 1).toString()
  });
  clipButton.textContent = '📎';

  // Add elements to document body
  document.body.appendChild(overlay);
  document.body.appendChild(clipButton);

  // Function to update positions with debouncing
  let updateTimeout: number | null = null;
  const updatePositions = () => {
    if (updateTimeout) {
      window.clearTimeout(updateTimeout);
    }
    updateTimeout = window.setTimeout(() => {
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
    }, 16); // Debounce for approximately one frame
  };

  // Create observers
  const resizeObserver = new ResizeObserver(() => {
    updatePositions();
  });

  const mutationObserver = new MutationObserver((mutations) => {
    const shouldUpdate = mutations.some(mutation =>
      mutation.type === 'attributes' &&
      (mutation.attributeName === 'style' || mutation.attributeName === 'class')
    );
    if (shouldUpdate) {
      updatePositions();
    }
  });

  // Observe the element and its parent for changes
  resizeObserver.observe(element);
  mutationObserver.observe(element, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  // Also observe parent elements up to body for style/class changes
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    mutationObserver.observe(parent, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    parent = parent.parentElement;
  }

  // Register this instance's update function
  ClipCollapseRegistry.register(updatePositions);

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

    // Update positions of all clips after animation
    setTimeout(() => {
      ClipCollapseRegistry.updateAll();
    }, parseFloat(animationDuration) * 1000);
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

    // Disconnect observers
    resizeObserver.disconnect();
    mutationObserver.disconnect();

    // Unregister this instance
    ClipCollapseRegistry.unregister(updatePositions);

    // Clear any pending updates
    if (updateTimeout) {
      window.clearTimeout(updateTimeout);
    }
  };
}

export { createClipCollapse, ClipCollapseOptions };