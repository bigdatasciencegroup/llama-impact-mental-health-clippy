export interface Config {
  apiKey: string;
  apiUrl: string;
  groqApiKey: string;
  groqApiUrl: string;
  groqModel: string;
}

// Function to get config in content script
export async function getConfig(): Promise<Config> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
      resolve(response || {
        apiKey: '',
        apiUrl: 'https://api.conjecture.dev/',
        groqApiKey: '',
        groqApiUrl: 'https://api.groq.com/',
        groqModel: 'llama3-8b-8192'
      });
    });
  });
}

// Function to get config in background/options pages
export async function getConfigDirect(): Promise<Config> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'apiUrl'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
        apiUrl: result.apiUrl || 'https://api.conjecture.dev/',
        groqApiKey: result.groqApiKey || '',
        groqApiUrl: result.groqApiUrl || 'https://api.groq.com/',
        groqModel: result.groqModel || 'llama3-8b-8192'
      });
    });
  });
}

// Function to set config (use in background/options pages only)
export async function setConfig(config: Partial<Config>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(config, resolve);
  });
}

export let config: Config | undefined;