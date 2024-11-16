document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('startSelection');
  const status = document.getElementById('status');

  if (button) {
    // Handle click
    button.addEventListener('click', () => {
      // Disable the button to prevent multiple clicks
      (button as HTMLButtonElement).disabled = true;

      // Add a rotating animation class
      button.style.transform = 'scale(0.95) rotate(180deg)';
      button.style.transition = 'all 0.3s ease';

      if (status) {
        status.textContent = 'Selecting element';
        // status.className = 'success';
        // status.style.display = 'block';
      }

      // Small delay for animation
      setTimeout(() => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab.id) {
            chrome.tabs.sendMessage(activeTab.id, {action: 'startSelection' as const});
            window.close();
          }
        });
      }, 300);
    });
  }
});