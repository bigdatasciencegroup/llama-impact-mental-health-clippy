export interface Config {
  apiKey: string;
  apiUrl: string;
}

export async function getConfig(): Promise<Config> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'apiUrl'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
        apiUrl: result.apiUrl || 'https://api.conjecture.dev/v1'
      });
    });
  });
}

export async function setConfig(config: Partial<Config>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(config, resolve);
  });
}