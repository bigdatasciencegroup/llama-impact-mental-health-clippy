import {AccessibilityNodeInfo, accessibilityTree} from "./contentloaded";

export class ElementSelector {
  private isActive: boolean = false;
  private isDragging: boolean = false;
  private mouseDownTime: number = 0;
  private selectorBox: HTMLDivElement | null = null;
  private previousElement: HTMLElement | null = null;
  private startX: number = 0;
  private startY: number = 0;

  constructor() {
    this.initializeSelectorBox();
  }

  private initializeSelectorBox() {
    this.selectorBox = document.createElement('div');
    this.selectorBox.style.cssText = `
            position: fixed;
            border: 2px solid #4CAF50;
            background: rgba(76, 175, 80, 0.1);
            pointer-events: none;
            z-index: 10000;
            display: none;
        `;
    document.body.appendChild(this.selectorBox);
  }

  start() {
    if (this.isActive) return;

    this.isActive = true;
    document.body.style.cursor = 'crosshair';

    // Add event listeners
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('keydown', this.handleKeyDown);

    // Prevent default behaviors
    this.preventDefaultEvents();
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.isActive) return;

    this.mouseDownTime = Date.now();
    this.startX = e.clientX;
    this.startY = e.clientY;

    // Initialize selector box position
    if (this.selectorBox) {
      this.selectorBox.style.left = `${this.startX}px`;
      this.selectorBox.style.top = `${this.startY}px`;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isActive) return;

    // Check if we should start dragging (after holding mouse down for 200ms)
    if (!this.isDragging && Date.now() - this.mouseDownTime > 200 && e.buttons === 1) {
      this.isDragging = true;
      if (this.selectorBox) {
        this.selectorBox.style.display = 'block';
      }
    }

    if (this.isDragging && this.selectorBox) {
      // Update selector box dimensions
      const width = e.clientX - this.startX;
      const height = e.clientY - this.startY;

      this.selectorBox.style.width = `${Math.abs(width)}px`;
      this.selectorBox.style.height = `${Math.abs(height)}px`;

      if (width < 0) {
        this.selectorBox.style.left = `${e.clientX}px`;
      }
      if (height < 0) {
        this.selectorBox.style.top = `${e.clientY}px`;
      }
    } else {
      // Handle hover highlight for click selection
      const target = e.target as HTMLElement;
      if (this.previousElement && this.previousElement !== target) {
        this.previousElement.style.outline = '';
      }
      target.style.outline = '2px solid #4CAF50';
      this.previousElement = target;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (!this.isActive) return;

    if (!this.selectorBox) this.handleSelection([]);
    else {
      if (this.isDragging) {
        // Handle drag selection
        const elements = this.getElementsInSelection(this.selectorBox.getBoundingClientRect());
        this.handleSelection(elements);
      } else {
        // Handle click selection
        const elements = this.getElementsInSelection((e.target as HTMLElement).getBoundingClientRect());
        this.handleSelection(elements);
      }
    }

    // Reset state
    this.isDragging = false;
    if (this.selectorBox) {
      this.selectorBox.style.display = 'none';
      this.selectorBox.style.width = '0';
      this.selectorBox.style.height = '0';
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.stop();
    }
  };

  private getElementsInSelection(rect: DOMRect): AccessibilityNodeInfo[] {
    const ret: AccessibilityNodeInfo[] = [];

    if (!this.selectorBox) return [];
    // const rect = this.selectorBox.getBoundingClientRect();
    const tree = [accessibilityTree];

    while (tree.length > 0) {
      const node = tree.pop();
      if (node === undefined) continue;
      tree.push(...(node.children || []));
      if (node.children !== undefined && node.children.length > 0) continue;
      if (node.boundingBox === undefined) {
        continue;
      }
      const {boundingBox, element} = node;
      if (boundingBox === undefined || element === undefined) {
        continue;
      }
      const {top, left, right, bottom} = boundingBox;
      if (left > rect.right || right < rect.left || top > rect.bottom || bottom < rect.top) {
        continue;
      }
      ret.push(node);
    }
    return ret;
  }

  private handleSelection(elements: AccessibilityNodeInfo[]) {
    // Send selected elements to background script
    chrome.runtime.sendMessage({
      action: 'textSelected',
      content: elements.map(element => element.content).join('\n')
    }).catch(console.error);

    this.stop();
  }

  private getXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts: string[] = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let siblings = Array.from(element.parentNode?.children || []);
      if (siblings.length > 1) {
        let index = siblings.indexOf(element) + 1;
        parts.unshift(`*[${index}]`);
      } else {
        parts.unshift(element.tagName.toLowerCase());
      }
      element = element.parentElement as HTMLElement;
    }
    return '/' + parts.join('/');
  }

  private preventDefaultEvents() {
    const preventDefault = (e: Event) => {
      if (this.isActive) {
        e.preventDefault();
      }
    };

    document.addEventListener('click', preventDefault, true);
    document.addEventListener('mousedown', preventDefault, true);
    document.addEventListener('mousemove', preventDefault, true);
    document.addEventListener('mouseup', preventDefault, true);
  }

  stop() {
    this.isActive = false;
    this.isDragging = false;
    document.body.style.cursor = '';

    // Remove hover highlight
    if (this.previousElement) {
      this.previousElement.style.outline = '';
      this.previousElement = null;
    }

    // Hide selector box
    if (this.selectorBox) {
      this.selectorBox.style.display = 'none';
    }

    // Remove event listeners
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}
