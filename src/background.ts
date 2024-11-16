// Chrome API type definitions
import {getCompletion} from "./app/groq";

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

import {config, getConfigDirect} from './config';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CONFIG') {
    getConfigDirect().then(sendResponse);
    return true; // Will respond asynchronously
  }
  if (message.action === 'textSelected') {
    // You can store the selection in chrome.storage
    chrome.storage.local.get({ flaggedHistory: [] }, async (result) => {
      console.log('Flagged history:', result.flaggedHistory);
      const history = result.flaggedHistory;
      if (message.content.trim().length > 50)
        history.push({content: message.content, timestamp: new Date().toISOString()});
      await chrome.storage.local.set({flaggedHistory: history});
      await updateSystemPrompt(message.content);
    });

    return true;
  }
});
getConfigDirect().then(_ => console.log("loaded config", config)).catch((err) => console.error('Failed to get config:', err));

const DEFAULT_SYSTEM_PROMPT = `Please flag content that refers to holes. Please flag content that refers to squids. Please flag content that refers to large language models or AI.`;
const updateQueue: string[] = [];
const updateSystemPrompt = async (new_flagged: string) => {
  updateQueue.push(new_flagged);
  if (!config) {
    console.error('Config not loaded');
    return;
  }

  if (updateQueue.length > 1) return;

  while (updateQueue.length > 0) {
    const new_flagged = updateQueue.shift();
    const system_prompt: string = (config.systemPrompt.trim().length < 10) ? config.systemPrompt: DEFAULT_SYSTEM_PROMPT;
    // update the system prompt
    const new_system_prompt = await getCompletion(`The following is a summary of the flagged content so far:
\`\`\`
${system_prompt}
\`\`\`

The following new content was flagged:
\`\`\`
${new_flagged}
\`\`\`

Update the summary to also flag the new content. Please keep the summary concise.
You can drop sections if the newly added content will include it. Wrap your final summary in triple back quotes, like \`\`\`.
Remember to output in the same format as the input.`, "llama3-70b-8192");

    chrome.storage.local.set({systemPrompt: new_system_prompt}).catch((err) => {
      console.error('Failed to update system prompt:', err);
    });
  }
}