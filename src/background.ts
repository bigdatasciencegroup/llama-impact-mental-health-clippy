// Chrome API type definitions
import {getCompletion} from "./app/groq";
import {getConfigDirect, setConfig} from './config';

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

const DEFAULT_SYSTEM_PROMPT = `Please flag content that refers to black holes. Please flag content that refers to octopuses. Please flag content that refers to large language models or AI.`;
const updateQueue: string[] = [];
const updateSystemPrompt = async (new_flagged: string) => {
  const config = await getConfigDirect();
  updateQueue.push(new_flagged);
  if (!config) {
    console.error('Config not loaded');
    return;
  }

  if (updateQueue.length > 1) return;

  while (updateQueue.length > 0) {
    await chrome.storage.local.set({ training : true });
    const new_flagged = updateQueue.shift();
    const system_prompt: string = (config.systemPrompt.trim().length > 10) ? config.systemPrompt: DEFAULT_SYSTEM_PROMPT;
    console.log('Using system prompt:', system_prompt);
    // update the system prompt
    let parsed: string[] = []
    let max_tries = 3;
    while (parsed.length < 3 && max_tries-- > 0) {
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
Remember to output in the same format as the input.`, "llama3-70b-8192") + '\nweird_hack_todo_remove';

      console.log('New system prompt response:', new_system_prompt);

      parsed = new_system_prompt.split('```');
    }

    if (parsed.length >= 3) {
      const parsed_system_prompt = parsed[1].trim();

      console.log('New system prompt:', parsed_system_prompt);
      // update the system prompt
      config.systemPrompt = parsed_system_prompt;
      await setConfig(config);
    } else {
      console.error('Failed to generate system prompt');
    }
  }
  await chrome.storage.local.set({ training : false });
}