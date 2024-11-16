import { getConfig, setConfig } from './config';

// Load saved options
document.addEventListener('DOMContentLoaded', async () => {
  const config = await getConfig();

  (document.getElementById('apiKey') as HTMLInputElement).value = config.apiKey;
  (document.getElementById('apiUrl') as HTMLInputElement).value = config.apiUrl;
});

// Save options
document.getElementById('save')?.addEventListener('click', async () => {
  const apiKey = (document.getElementById('apiKey') as HTMLInputElement).value;
  const apiUrl = (document.getElementById('apiUrl') as HTMLInputElement).value;

  await setConfig({ apiKey, apiUrl });

  // Show saved message
  const status = document.getElementById('status');
  if (status) {
    status.textContent = 'Options saved!';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  }
});