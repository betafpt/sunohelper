// Helper to find Suno's inputs
function findInputs() {
    const textareas = Array.from(document.querySelectorAll('textarea'));
    let lyricsEl = null; let styleEl = null;

    for (const ta of textareas) {
        const placeholder = (ta.getAttribute('placeholder') || '').toLowerCase();
        if (placeholder.includes('lyrics') || ta.id.toLowerCase().includes('lyrics')) lyricsEl = ta;
        else if (placeholder.includes('style') || ta.id.toLowerCase().includes('style')) styleEl = ta;
    }

    if (!styleEl) {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        for (const input of inputs) {
             if ((input.getAttribute('placeholder') || '').toLowerCase().includes('style')) styleEl = input;
        }
    }
    
    if (!lyricsEl && textareas.length > 0) {
        lyricsEl = textareas.reduce((max, obj) => (obj.scrollHeight > max.scrollHeight) ? obj : max, textareas[0]);
    }
    return { lyricsEl, styleEl };
}

// React controlled input helper
function setNativeValue(element, value) {
    if (!element) return;
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    
    if (valueSetter && valueSetter !== prototypeValueSetter) prototypeValueSetter.call(element, value);
    else if (valueSetter) valueSetter.call(element, value);
    else element.value = value;
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

function fillSunoForm(lyrics, styleTags) {
    const { lyricsEl, styleEl } = findInputs();
    if (lyricsEl && lyrics) setNativeValue(lyricsEl, lyrics);
    if (styleEl && styleTags) setNativeValue(styleEl, styleTags);
}

// Sidebar Injection
function injectSidebar() {
    if (document.getElementById('suno-studio-sidebar')) return;

    const sidebar = document.createElement('div');
    sidebar.id = 'suno-studio-sidebar';
    sidebar.innerHTML = `
        <div id="ss-header" style="display:flex; justify-content:center; align-items:center; padding: 36px 20px;">
            <img src="${chrome.runtime.getURL('icons/logo.png')}" style="width: 85%; max-height: 80px; object-fit: contain;" alt="RYTHM Logo">
        </div>
        <div id="ss-tabs">
            <div class="ss-tab active" data-target="tab-gen" title="Tạo Nhanh">Tạo Nhạc</div>
            <div class="ss-tab" data-target="tab-rhyme" title="Từ Điển Vần">Tìm Vần</div>
            <div class="ss-tab" data-target="tab-sug" title="Chủ đề & Tên">Gợi ý</div>
            <div class="ss-tab" data-target="tab-analyze" title="Cấu trúc & Trùng lặp">Phân tích</div>
        </div>
        
        <!-- Tab: Generate -->
        <div class="ss-tab-content active" id="tab-gen">
            <label>Ý tưởng bài hát (Topic):</label>
            <textarea id="ss-prompt-gen" placeholder="Ví dụ: Một bài nhạc Trap rap cực gắt về sự nỗ lực vươn lên..."></textarea>
            <button id="ss-btn-gen" class="ss-btn">✨ Tạo Lyrics & Style</button>
            <div class="ss-status" id="ss-status-gen"></div>
        </div>

        <!-- Tab: Rhyme -->
        <div class="ss-tab-content" id="tab-rhyme">
            <label>Từ/Cụm từ gốc:</label>
            <input type="text" id="ss-input-rhyme" placeholder="VD: lang thang">
            <label style="margin-top: 4px;">Loại vần muốn tìm:</label>
            <select id="ss-select-rhyme">
                <option value="don">Vần đơn (Ví dụ: mang, sang, ngang)</option>
                <option value="doi">Vần đôi (Ví dụ: đàng hoàng, phũ phàng)</option>
                <option value="ba">Vần ba (Ví dụ: không rõ ràng)</option>
                <option value="dao">Vần đảo (Anagram / Chơi chữ)</option>
                <option value="anh">Vần Tiếng Anh (Rhymes in English)</option>
            </select>
            <button id="ss-btn-rhyme" class="ss-btn">🔍 Tìm Vần</button>
            <div class="ss-status" id="ss-status-rhyme"></div>
            <div class="ss-results" id="ss-results-rhyme" style="display:none;"></div>
        </div>

        <!-- Tab: Suggest -->
        <div class="ss-tab-content" id="tab-sug">
            <label>Loại gợi ý AI:</label>
            <select id="ss-select-sug">
                <option value="genre">Tra cứu Thể loại (Nhập tên bài hát nổi tiếng)</option>
                <option value="title">Gợi ý Tên Bài Hát</option>
                <option value="topic">Gợi ý Chủ Đề (Topic mới lạ)</option>
                <option value="next_line">Gợi ý Câu Tiếp Theo (Theo lời hiện tại)</option>
            </select>
            <label style="margin-top: 4px;">Nội dung / Bối cảnh:</label>
            <textarea id="ss-input-sug" placeholder="VD: Để tra thể loại, hãy nhập 'Khóc - Đông Nhi'. Để xin gợi ý, nhập ý tưởng..." style="height: 60px;"></textarea>
            <button id="ss-btn-sug" class="ss-btn">💡 Hỏi AI</button>
            <div class="ss-status" id="ss-status-sug"></div>
            <div class="ss-results" id="ss-results-sug" style="display:none;"></div>
        </div>

        <!-- Tab: Analyze -->
        <div class="ss-tab-content" id="tab-analyze">
            <p style="font-size:13px; color:#94a3b8; margin:0; line-height:1.5;">Trợ lý AI sẽ đọc Lời Bài Hát hiện tại để phân tích cấu trúc chuẩn và lỗi lặp từ.</p>
            <button id="ss-btn-analyze" class="ss-btn">📑 Bắt Đầu Phân Tích</button>
            <div class="ss-status" id="ss-status-analyze"></div>
            <div class="ss-results" id="ss-results-analyze" style="display:none;"></div>
        </div>
    `;

    const toggleBtn = document.createElement('div');
    toggleBtn.id = 'ss-toggle-btn';
    toggleBtn.innerHTML = '<span id="ss-icon-toggle">◀</span><span class="ss-vert-text">STUDIO</span>';
    
    document.body.appendChild(sidebar);
    document.body.appendChild(toggleBtn);

    // Toggle logic
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        const isOpen = sidebar.classList.contains('open');
        document.getElementById('ss-icon-toggle').textContent = isOpen ? '▶' : '◀';
        toggleBtn.style.right = isOpen ? '380px' : '0';
    });

    // Tab logic
    document.querySelectorAll('.ss-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.ss-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.ss-tab-content').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });

    setupActions();
}

function setupActions() {
    // 1. Generate Generator
    document.getElementById('ss-btn-gen').addEventListener('click', () => {
        const prompt = document.getElementById('ss-prompt-gen').value.trim();
        if(!prompt) return;
        callBackground('generate', { prompt }, 'gen');
    });

    // 2. Rhyme Finder
    document.getElementById('ss-btn-rhyme').addEventListener('click', () => {
        const word = document.getElementById('ss-input-rhyme').value.trim();
        const type = document.getElementById('ss-select-rhyme').value;
        if(!word) return;
        callBackground('rhyme', { word, type }, 'rhyme');
    });

    // 3. Suggestions
    document.getElementById('ss-btn-sug').addEventListener('click', () => {
        const type = document.getElementById('ss-select-sug').value;
        const context = document.getElementById('ss-input-sug').value.trim();
        
        let lyricsContext = "";
        if (type === 'next_line') {
            const { lyricsEl } = findInputs();
            if (lyricsEl && lyricsEl.value) lyricsContext = lyricsEl.value;
        }
        
        callBackground('suggest', { type, context, lyricsContext }, 'sug');
    });

    // 4. Analyze
    document.getElementById('ss-btn-analyze').addEventListener('click', () => {
        const { lyricsEl } = findInputs();
        if (!lyricsEl || !lyricsEl.value.trim()) {
            const status = document.getElementById('ss-status-analyze');
            status.textContent = 'Trống! Hãy nhập lời bài hát vào khung Suno trước.';
            status.style.color = '#ef4444';
            return;
        }
        callBackground('analyze', { lyrics: lyricsEl.value }, 'analyze');
    });
}

function callBackground(action, payload, tabId) {
    const btn = document.getElementById(`ss-btn-${tabId}`);
    const status = document.getElementById(`ss-status-${tabId}`);
    const results = document.getElementById(`ss-results-${tabId}`);
    
    // UI state
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = 'Đang xử lý AI...';
    status.textContent = '';
    
    if(results) {
        results.style.display = 'none';
        results.innerHTML = '';
    }

    chrome.runtime.sendMessage({ action, ...payload }, (response) => {
        btn.disabled = false;
        btn.textContent = oldText;

        if (chrome.runtime.lastError || !response) {
            status.textContent = 'Lỗi kết nối tới Background script.';
            status.style.color = '#ef4444';
            return;
        }

        if (response.success) {
            status.textContent = 'Thành công!';
            status.style.color = '#4ade80';
            
            if (action === 'generate') {
                fillSunoForm(response.data.lyrics, response.data.style_tags);
            } else if (results) {
                results.style.display = 'block';
                // Render nicely (Background script should format markdown to simple HTML or we use simple line breaks)
                // For safety, replace HTML markers manually to prevent XSS. 
                // Or just use innerText/textContent if returning plain text.
                // We will use innerHTML but rely on background script to format it with basic <b> <br> tags.
                // For now, let's just make \n into <br> and **text** into <b>text</b>
                let html = response.data
                    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                    .replace(/\n/g, '<br>');
                results.innerHTML = html;
            }
        } else {
            status.textContent = 'Lỗi AI: ' + response.error;
            status.style.color = '#ef4444';
        }
    });
}

setInterval(() => {
    if (window.location.href.includes('/create')) {
        injectSidebar();
    }
}, 2000);
