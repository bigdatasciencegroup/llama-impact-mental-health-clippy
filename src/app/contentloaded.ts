interface AccessibilityNodeInfo {
  role: string;
  name: string;
  children?: AccessibilityNodeInfo[];
  value?: string;
  states?: string[];
  attributes?: Record<string, string>;
  boundingBox?: DOMRect;
}

const processNode = (element: Element): AccessibilityNodeInfo => {
  // Get computed role
  const role = element.getAttribute('role') || element.tagName.toLowerCase();

  // Get accessible name using accname algorithm approximation
  const getAccessibleName = (el: Element): string => {
    return el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.getAttribute('alt') ||
      el.getAttribute('title') ||
      (el instanceof HTMLInputElement ? el.placeholder : '') ||
      el.textContent || '';
  };

  // Get states and properties
  const states: string[] = [];
  const attributes: Record<string, string> = {};

  // Collect ARIA attributes
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('aria-')) {
      const stateName = attr.name.replace('aria-', '');
      if (['checked', 'disabled', 'expanded', 'selected', 'pressed', 'hidden'].includes(stateName)) {
        states.push(stateName);
      }
      attributes[attr.name] = attr.value;
    }
  });

  // Add focus state
  if (document.activeElement === element) {
    states.push('focused');
  }

  // Get bounding box for location information
  const boundingBox = element.getBoundingClientRect();

  // Create node info
  const nodeInfo: AccessibilityNodeInfo = {
    role: role,
    name: getAccessibleName(element).trim(),
    children: [],
    states: states,
    attributes: attributes,
    boundingBox: boundingBox
  };

  // Get value if applicable
  if (element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement) {
    nodeInfo.value = element.value;
  }

  // Process children that are not hidden
  Array.from(element.children)
    .filter(child => !child.hasAttribute('aria-hidden') &&
      !child.getAttribute('hidden') &&
      getComputedStyle(child).display !== 'none')
    .forEach(child => {
      nodeInfo.children?.push(processNode(child));
    });

  return nodeInfo;
};

const processTree = (tree: AccessibilityNodeInfo): void => {
}

export async function afterDOMLoaded(): Promise<void> {
  try {
    // Function to get the full tree
    const getAccessibilityTree = () => {
      return processNode(document.body);
    };

    // Get initial tree
    const accessibilityTree = getAccessibilityTree();

    // Log the complete tree
    console.log('Initial Accessibility Tree:', accessibilityTree);

    processTree(accessibilityTree);

    // Create debounced update function
    let debounceTimeout: number | undefined;
    const debouncedUpdate = () => {
      if (debounceTimeout) {
        window.clearTimeout(debounceTimeout);
      }

      debounceTimeout = window.setTimeout(() => {
        const updatedTree = getAccessibilityTree();
        console.log('Updated Accessibility Tree:', updatedTree);

        chrome.runtime.sendMessage({
          type: 'ACCESSIBILITY_TREE_UPDATED',
          payload: updatedTree
        });
      }, 500);
    };

    // Set up mutation observer to watch for DOM changes
    const observer = new MutationObserver(() => {
      debouncedUpdate();
    });

    // Start observing with a comprehensive config
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'role',
        'aria-label',
        'aria-labelledby',
        'aria-hidden',
        'aria-disabled',
        'aria-expanded',
        'aria-checked',
        'aria-selected',
        'aria-pressed',
        'alt',
        'title',
        'hidden'
      ],
      characterData: true
    });

    // Clean up observer when needed
    window.addEventListener('unload', () => {
      observer.disconnect();
      if (debounceTimeout) {
        window.clearTimeout(debounceTimeout);
      }
    });

  } catch (error) {
    console.error('Error in afterDOMLoaded:', error);
  }
}

// Helper function to find nodes in the accessibility tree
export function findAccessibilityNode(
  root: AccessibilityNodeInfo,
  predicate: (node: AccessibilityNodeInfo) => boolean
): AccessibilityNodeInfo | null {
  if (predicate(root)) {
    return root;
  }

  if (root.children) {
    for (const child of root.children) {
      const found = findAccessibilityNode(child, predicate);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

// Helper function to find all matching nodes
export function findAllAccessibilityNodes(
  root: AccessibilityNodeInfo,
  predicate: (node: AccessibilityNodeInfo) => boolean
): AccessibilityNodeInfo[] {
  const results: AccessibilityNodeInfo[] = [];

  if (predicate(root)) {
    results.push(root);
  }

  if (root.children) {
    for (const child of root.children) {
      results.push(...findAllAccessibilityNodes(child, predicate));
    }
  }

  return results;
}