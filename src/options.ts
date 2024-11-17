import { getConfigDirect, setConfig } from './config';
import type { Config } from './config';
import {finetune, PostFinetuneStepRequest} from "./app/conjecture";

const saveButton = document.getElementById('save') as HTMLButtonElement;
const conjButton = document.getElementById('trainConjecture') as HTMLButtonElement;
const statusDiv = document.getElementById('status')!;
const currentConfigDiv = document.getElementById('currentConfig')!;

function showStatus(message: string, isError: boolean = false) {
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
  statusDiv.className = isError ? 'error' : 'success';

  if (!isError) {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

async function loadCurrentConfig() {
  try {
    const config = await getConfigDirect();
    currentConfigDiv.textContent = JSON.stringify({
      systemPrompt: config.systemPrompt ? (config.systemPrompt.length > 20 ?
        config.systemPrompt.substring(0, 20) + '...' : config.systemPrompt) : 'Not set',
      conjApiKey: config.conjApiKey ? '****' + config.conjApiKey.slice(-4) : 'Not set',
      conjApiUrl: config.conjApiUrl || 'Not set',
      groqApiKey: config.groqApiKey ? '****' + config.groqApiKey.slice(-4) : 'Not set',
      groqApiUrl: config.groqApiUrl || 'Not set',
      groqModel: config.groqModel || 'Not set'
    }, null, 2);

    // Pre-fill the form
    (document.getElementById('systemPrompt') as HTMLTextAreaElement).value = config.systemPrompt || '';
    (document.getElementById('conjApiKey') as HTMLInputElement).value = config.conjApiKey || '';
    (document.getElementById('conjApiUrl') as HTMLInputElement).value = config.conjApiUrl || '';
    (document.getElementById('groqApiKey') as HTMLInputElement).value = config.groqApiKey || '';
    (document.getElementById('groqApiUrl') as HTMLInputElement).value = config.groqApiUrl || '';
    (document.getElementById('groqModel') as HTMLInputElement).value = config.groqModel || '';
  } catch (error) {
    currentConfigDiv.textContent = 'Error loading configuration';
    showStatus('Failed to load current configuration: ' + (error as Error).message, true);
  }
}

function validateUrl(url: string): boolean {
  if (!url) return true; // Empty URLs are valid now
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateInputs(): boolean {
  const conjApiUrl = (document.getElementById('conjApiUrl') as HTMLInputElement).value;
  const groqApiUrl = (document.getElementById('groqApiUrl') as HTMLInputElement).value;

  // Only validate URLs if they are provided
  if (conjApiUrl && !validateUrl(conjApiUrl)) {
    showStatus('Invalid Conjecture API URL format. Please enter a valid URL or leave it empty', true);
    return false;
  }

  if (groqApiUrl && !validateUrl(groqApiUrl)) {
    showStatus('Invalid Groq API URL format. Please enter a valid URL or leave it empty', true);
    return false;
  }

  return true;
}

// Save options
saveButton.addEventListener('click', async () => {
  try {
    if (!validateInputs()) {
      return;
    }

    const config: Config = {
      systemPrompt: (document.getElementById('systemPrompt') as HTMLTextAreaElement).value,
      conjApiKey: (document.getElementById('conjApiKey') as HTMLInputElement).value,
      conjApiUrl: (document.getElementById('conjApiUrl') as HTMLInputElement).value,
      groqApiKey: (document.getElementById('groqApiKey') as HTMLInputElement).value,
      groqApiUrl: (document.getElementById('groqApiUrl') as HTMLInputElement).value,
      groqModel: (document.getElementById('groqModel') as HTMLInputElement).value
    };

    // Disable the save button while saving
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    await setConfig(config);
    showStatus('Settings saved successfully!');

    // Reload the current configuration display
    await loadCurrentConfig();
  } catch (error) {
    showStatus('Error saving settings: ' + (error as Error).message, true);
  } finally {
    // Re-enable the save button
    saveButton.disabled = false;
    saveButton.textContent = 'Save Settings';
  }
});

async function trainConjecture() {
  const dataset = await chrome.storage.local.get({flaggedHistory: []});
  const flaggedContent: Array<PostFinetuneStepRequest> = dataset.flaggedHistory
    .map((item: {content: string, timestamp: string}) => item.content)
    .filter((item: string) => item.trim().length > 10)
    .map((sample: string) => {
      return {
        loras: [],
        losses: {
          "sft": {type: "sft", weight: 1.},
          "kl": {type: "kl", weight: 0.2}
        },
        optim: {
          lr: 1e-4,
          betas: ["0.9", "0.999"],
          weight_decay: 0.01
        },
        step: 0,
        batch: {
          items: [
            {
              messages: [
                {
                  content: "You are filtering messages into DROP or FORWARD",
                  role: "system",
                  weight: 0.
                },
                {
                  content: sample,
                  role: "user",
                  weight: 0.
                },
                {
                  content: "DROP",
                  role: "assistant",
                  weight: 1.
                }
              ]
            }
          ]
        }
      }
    });

  // Train the model
  const resp = await finetune(flaggedContent);
  console.log(resp)
}

conjButton.addEventListener('click', trainConjecture);

// Load current configuration when the page loads
document.addEventListener('DOMContentLoaded', loadCurrentConfig);