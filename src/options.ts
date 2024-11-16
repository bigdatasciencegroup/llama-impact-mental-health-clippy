import { getConfigDirect, setConfig } from './config';

const saveButton = document.getElementById('save') as HTMLButtonElement;
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
      apiKey: config.apiKey ? '****' + config.apiKey.slice(-4) : 'Not set',
      apiUrl: config.apiUrl || 'Not set'
    }, null, 2);

    // Pre-fill the form
    (document.getElementById('apiKey') as HTMLInputElement).value = config.apiKey;
    (document.getElementById('apiUrl') as HTMLInputElement).value = config.apiUrl;
  } catch (error) {
    currentConfigDiv.textContent = 'Error loading configuration';
    showStatus('Failed to load current configuration: ' + (error as Error).message, true);
  }
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateInputs(): boolean {
  const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
  const apiUrl = (document.getElementById('apiUrl') as HTMLInputElement).value;

  if (!apiKey.trim()) {
    showStatus('API Key is required', true);
    return false;
  }

  if (!apiUrl.trim()) {
    showStatus('API URL is required', true);
    return false;
  }

  if (!validateUrl(apiUrl)) {
    showStatus('Invalid API URL format. Please enter a valid URL (e.g., https://api.example.com)', true);
    return false;
  }

  return true;
}

// Save options
saveButton.addEventListener('click', async () => {
  try {
    const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
    const apiUrl = (document.getElementById('apiUrl') as HTMLInputElement).value;

    if (!validateInputs()) {
      return;
    }

    // Disable the save button while saving
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    await setConfig({ apiKey, apiUrl });
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

// Test connection button (optional)
// const testButton = document.createElement('button');
// testButton.textContent = 'Test Connection';
// testButton.style.marginLeft = '10px';
// saveButton.parentNode?.insertBefore(testButton, saveButton.nextSibling);

// testButton.addEventListener('click', async () => {
//     const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
//     const apiUrl = (document.getElementById('apiUrl') as HTMLInputElement).value;

//     if (!validateInputs()) return;

//     try {
//         testButton.disabled = true;
//         testButton.textContent = 'Testing...';

//         const response = await fetch(apiUrl, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${apiKey}`
//             }
//         });

//         if (response.ok) {
//             showStatus('Connection successful!');
//         } else {
//             showStatus(`Connection failed: ${response.statusText}`, true);
//         }
//     } catch (error) {
//         showStatus('Connection test failed: ' + (error as Error).message, true);
//     } finally {
//         testButton.disabled = false;
//         testButton.textContent = 'Test Connection';
//     }
// });

// Load current configuration when the page loads
document.addEventListener('DOMContentLoaded', loadCurrentConfig);