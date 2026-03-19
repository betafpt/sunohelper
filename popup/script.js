document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');

    // Load saved API key
    chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
        }
    });

    // Save API key
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter an API key', '#ef4444'); // Red for error
            return;
        }

        if (!apiKey.startsWith('AIza')) {
            showStatus('Warning: Invalid Gemini API key format?', '#eab308'); // Yellow for warning
            // Still save it in case
        }

        chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
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
