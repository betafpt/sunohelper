document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');

    // Load saved API key
    chrome.storage.local.get(['openaiApiKey'], (result) => {
        if (result.openaiApiKey) {
            apiKeyInput.value = result.openaiApiKey;
        }
    });

    // Save API key
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter an API key', '#ef4444'); // Red for error
            return;
        }

        if (apiKey.length < 10) {
            showStatus('Warning: API key format might be invalid?', '#eab308'); // Yellow for warning
            // Still save it in case
        }

        chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
            showStatus('Settings saved successfully!', '#4ade80'); // Green for success
        });
    });

    function showStatus(message, color) {
        statusDiv.textContent = message;
        statusDiv.style.color = color;
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 3000);
    }
});
