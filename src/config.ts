export interface Config {
  systemPrompt: string;
  conjApiKey: string;
  conjApiUrl: string;
  groqApiKey: string;
  groqApiUrl: string;
  groqModel: string;
}

// Function to get config in content script
export async function getConfig(): Promise<Config> {
  config = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
      resolve(response);
    });
  });

  if (config === undefined || config === null || typeof config !== 'object') {
    throw new Error('Failed to get config');
  }
  // make sure all fields are present
  for (const field of Object.keys({} as Config)) {
    if (!(field in config)) {
      throw new Error(`Missing field in config: ${field}`);
    }
  }
  return config;
}

// Function to get config in background/options pages
export async function getConfigDirect(): Promise<Config> {
  config = await new Promise((resolve) => {
    chrome.storage.sync.get(null, (result) => {
      console.log("Got config", result);
      resolve({
        conjApiKey: result.apiKey || '',
        conjApiUrl: result.apiUrl || 'https://api.conjecture.dev/',
        groqApiKey: result.groqApiKey || '',
        groqApiUrl: result.groqApiUrl || 'https://api.groq.com/',
        groqModel: result.groqModel || 'llama3-8b-8192',
        systemPrompt: result.systemPrompt || ''
      });
    });
  });

  if (config === undefined) {
    throw new Error('Failed to get config');
  }
  return config;
}

// Function to set config (use in background/options pages only)
export async function setConfig(config: Partial<Config>): Promise<void> {
  return new Promise((resolve) => {
    console.log("Setting config", config);
    chrome.storage.sync.set(config).then(() => {
      resolve();
    }).catch((error) => {
      console.error('Failed to set config:', error);
      throw new Error('Failed to set config');
    });
  });
}

export let config: Config | undefined;