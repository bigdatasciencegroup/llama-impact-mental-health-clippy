// Chrome API type definitions
type TabChangeInfo = chrome.tabs.TabChangeInfo;
type Tab = chrome.tabs.Tab;

// Function to execute in the tab context
function injectContentScript(): void {
  console.log('Background content script called');
}

// Listen for when a tab is updated
chrome.tabs.onUpdated.addListener((
  tabId: number,
  changeInfo: TabChangeInfo,
  tab: Tab
): void => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Page loaded:', tab.url);

    // Execute your code when page loads
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: injectContentScript
    }).catch((err: Error) => {
      console.error('Failed to inject script:', err);
    });
  }
});