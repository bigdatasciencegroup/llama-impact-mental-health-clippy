import {createClipCollapse} from "./hiders/collapse";
import {ElementSelector} from "./selector";
import {config, getConfig} from "../config";
import {getCompletion} from "./groq";

export  interface AccessibilityNodeInfo {
  role: string;
  content: string;
  children?: AccessibilityNodeInfo[];
  states?: string[];
  attributes?: Record<string, string>;
  boundingBox?: DOMRect;
  element: HTMLElement;
}

const processNode = (element: HTMLElement): AccessibilityNodeInfo => {
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
    content: getAccessibleName(element).trim(),
    children: [],
    states: states,
    attributes: attributes,
    boundingBox: boundingBox,
    element: element
  };

  // Get value if applicable
  if (element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement) {
    nodeInfo.content += ': ' +element.value;
  }

  // Process children that are not hidden
  Array.from(element.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter(child => !child.hasAttribute('aria-hidden') &&
      !child.getAttribute('hidden') &&
      getComputedStyle(child).display !== 'none')
    .forEach(child => {
      nodeInfo.children?.push(processNode(child));
    });
  return nodeInfo;
};


const collapsedElements = new Set<() => void>();
export const addCollapsedElementHandler = (handler: () => void): void => {
  collapsedElements.add(handler);
}
const collapseElement = (element: HTMLElement): void => {
  // collapsedElements.add(createBlurOverlay(element));
  collapsedElements.add(createClipCollapse(element));
}

const getSystemPrompt = (): string => {
  if (!config) {
    throw new Error('Config not loaded');
  }

  return `Use the following guidelines to evaluate the user's message, and respond with a decision for blocking or allowing the content based on the following:
${config.systemPrompt}

To block, output "DROP". To allow, output "FORWARD". Please be terse and output one of DROP or FORWARD.`;
}

const blockPredicate = async (content: string): Promise<boolean> => {
  const resp = await getCompletion([{role: 'system', content: getSystemPrompt()},{role: 'user', content: content}]);

  if (resp.includes('DROP')) {
    return true;
  } else if (resp.includes('FORWARD')) {
    return false;
  }
  console.log('Invalid response - defaulting to FORWARD:', resp);
  return false;
  // if (content.toLowerCase().includes('x')) {
  //   return true;
  // }
  // return false;
}

const processTree = async (tree: AccessibilityNodeInfo): Promise<void> => {
  if (tree.content.length > 3500) {
    if (tree.children === undefined || tree.children.length === 0) {
      console.error('leaf node too large - ignoring');
    }
    tree.children?.map(child => processTree(child));
  } else if (tree.content.length < 5) {
    // we really don't care about this
    // do nothing
  } else if (tree.content.length < 500) {
    // definitely group this as a group
    if (await blockPredicate(tree.content)) {
      collapseElement(tree.element);
    }
  } else {
    // see if we want to cut these up or nah
    let continue_recurse: boolean = false;
    if (tree.children !== undefined && tree.children.length > 0) {
      const children_length = tree.children.map(c => c.content.length);
      // calculate variance
      const mean = children_length.reduce((a, b) => a + b) / children_length.length;
      const variance = children_length.reduce((a, b) => a + (b - mean) ** 2) / children_length.length;
      if (variance < 500) {
        continue_recurse = true;
      }
    }
    if (continue_recurse) {
      tree.children?.map(child => processTree(child));
    } else {
      if (await blockPredicate(tree.content)) {
        collapseElement(tree.element);
      }
    }
  }
}
export let accessibilityTree: AccessibilityNodeInfo;
export async function afterDOMLoaded(): Promise<void> {
  try {
    /**
     * set up the selector
     */
    const selector = new ElementSelector();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'startSelection') {
        selector.start();
      }
      return true;
    });

    /**
     * set up the accessibility tree and blurring
     */
    // Function to get the full tree
    const getAccessibilityTree = () => {
      return processNode(document.body);
    };

    // Get initial tree
    accessibilityTree = getAccessibilityTree();

    // Log the complete tree
    console.log('Initial Accessibility Tree:', accessibilityTree);

    await getConfig();  // depending on side effects is terrible terrible terrible

    await processTree(accessibilityTree);

    // Create debounced update function
    let debounceTimeout: number | undefined;
    const debouncedUpdate = () => {
      if (debounceTimeout) {
        window.clearTimeout(debounceTimeout);
      }

      debounceTimeout = window.setTimeout(() => {
        accessibilityTree = getAccessibilityTree();
        console.error('Updated Accessibility Tree (ignored):', accessibilityTree);
        // processTree(accessibilityTree);
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