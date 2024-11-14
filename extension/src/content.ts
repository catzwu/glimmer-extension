let isExtensionActive = false;

function createHighlight(selectedText: string) {
  // Send message to background script to add highlight
  chrome.runtime.sendMessage({
    type: 'ADD_HIGHLIGHT',
    text: selectedText
  });
}

function setupHighlightListener() {
  document.addEventListener('mouseup', () => {
    
    if (!isExtensionActive) return;

    const selection = window.getSelection();
    if (selection) {
      const selectedText = selection.toString().trim();
      if (selectedText.length > 0) {
        createHighlight(selectedText);
      }
    }
  });
}

// Listen for activation state from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
    switch (message.type) {
        case 'TOGGLE_ACTIVATION':
          // Broadcast activation state to all tabs
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'EXTENSION_STATE',
                  isActive: message.isActive
                });
              }
            });
          });
          break;
        }
});

// Initial setup
setupHighlightListener();
export {};