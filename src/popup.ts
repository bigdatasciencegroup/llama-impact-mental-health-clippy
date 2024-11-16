type PageContent = {
  html: string;
  text: string;
};

const getPageContent = async (): Promise<void> => {
  try {
    console.log('Getting page content...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      throw new Error('No active tab');
    }

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (): PageContent => ({
        html: document.documentElement.outerHTML,
        text: document.body.innerText
      })
    });

    if (!result || !result.result) {
      console.error('No result');
      throw new Error('No result');
    }

    console.log('HTML Content:', result.result.html);
    console.log('Text Content:', result.result.text);

  } catch (error) {
    console.error('Error:', error);
  }
};

document.addEventListener('DOMContentLoaded', getPageContent);