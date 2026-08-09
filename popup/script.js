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
            showStatus('Vui lòng nhập API key', '#ef4444');
            return;
        }

        if (apiKey.length < 10) {
            showStatus('Cảnh báo: API key có thể chưa đúng định dạng', '#d97706');
        }

        chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
            showStatus('Đã lưu cài đặt thành công!', '#20a46b');
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
