chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleGeminiAction(request)
        .then(data => sendResponse({ success: true, data: data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Giữ channel mở để xử lý Async
});

async function handleGeminiAction(request) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['geminiApiKey'], async (result) => {
            if (!result.geminiApiKey) {
                reject(new Error('Chưa thiết lập API Key. Vui lòng mở tiện ích và điền Key.'));
                return;
            }

            try {
                const response = await callGeminiAPI(result.geminiApiKey, request);
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });
    });
}

function getSystemInstruction(action, data) {
    if (action === 'generate') {
        return `Bạn là một nhà sản xuất âm nhạc và nhạc sĩ chuyên viết lời bài hát chuyên nghiệp cho Suno AI.
Nhiệm vụ: Viết Lời bài hát (Lyrics) và Thẻ phong cách (Style tags) dựa trên ý tưởng của người dùng.
Yêu cầu bắt buộc:
1. Lời bài hát phải có cấu trúc chuẩn chuyên nghiệp, chia rõ ràng các phần: [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro].
2. Lời bài hát phải có vần điệu, nhịp nhàng.
3. Style tags phải nằm dưới 120 ký tự, ngắn gọn, phân tách bằng dấu phẩy (VD: pop rock, male vocal, energetic, fast tempo).

TRẢ VỀ DUY NHẤT AUDIO OBJECT JSON THEO ĐỊNH DẠNG:
{
  "style_tags": "string",
  "lyrics": "string"
}`;
    }

    if (action === 'rhyme') {
        let typeText = "Vần bất kỳ";
        if (data.type === 'don') typeText = "Vần đơn (1 âm tiết cuối giống nhau)";
        if (data.type === 'doi') typeText = "Vần đôi (2 âm tiết cuối giống nhau, Vd: lang thang - mang sang)";
        if (data.type === 'ba') typeText = "Vần ba (3 âm tiết cuối giống nhau, Vd: không rõ ràng - trông ngỡ ngàng)";
        if (data.type === 'dao') typeText = "Vần đảo (Đảo vị trí các từ/âm tiết)";
        if (data.type === 'anh') typeText = "Vần tiếng Anh (Rhymes in English)";

        return `Bạn là chuyên gia ngôn ngữ học và Rapper chuyên nghiệp. Bạn có khả năng tìm từ đồng âm, đồng vần xuất sắc.
Nhiệm vụ: Người dùng sẽ đưa ra một từ/cụm từ gốc. Bạn phải tìm ra ít nhất 15-20 gợi ý vần và các câu ngắn có chứa vần điệu đó.
Loại vần đang ưu tiên tìm: ${typeText}.
Yêu cầu trình bày:
- Trình bày dạng danh sách gạch đầu dòng rõ ràng, gọn gàng.
- **In đậm** các từ hoặc cụm từ mang vần điệu đó.
- Không cần giải thích dài dòng hay chào hỏi, hãy đi thẳng vào kết quả để người dùng dễ copy/paste.`;
    }

    if (action === 'suggest') {
        return `Bạn là một chuyên gia âm nhạc và hỗ trợ sáng tác (Co-writer/Producer).
Nhiệm vụ: Phân tích hoặc đưa ra gợi ý xuất sắc để người dùng phát triển bài hát trên Suno AI.
Mục tiêu hiện tại: ${data.type} (title = Đặt tên bài hát CỰC CHẤT, topic = Gợi ý ý tưởng concept, next_line = Gợi ý câu hát tiếp, genre = Phân tích thể loại/style tags của một bài hát có thật).
Yêu cầu trình bày:
- Nếu user cần 'genre' (thể loại): Hãy liệt kê chính xác các Style Tags (thể loại, nhạc cụ, tempo, âm hưởng/mood, loại giọng hát) của bài hát được nhắc đến. Đưa ra một chuỗi tags chuẩn (ngăn cách bằng dấu phẩy, dùng Tiếng Anh) để user copy thẳng vào Suno. Sau đó giải thích ngắn gọn bằng Tiếng Việt.
- Nếu là các gợi ý khác: Dùng dạng danh sách gạch đầu dòng, bắt tai và tự nhiên. Đề xuất 3-5 option.
- In đậm những từ khóa quan trọng.`;
    }

    if (action === 'analyze') {
        return `Bạn là nhà phê bình âm nhạc và biên tập viên khắt khe.
Nhiệm vụ: Phân tích Lời Bài Hát (Lyrics) hiện tại mà người dùng đang viết trên Suno.
Các chỉ tiêu kiểm tra:
1. Xét cấu trúc chuẩn: Bài hát đã có đủ cấu trúc Verse (Phiên khúc) -> Chorus (Điệp khúc) -> Bridge (Đoạn nối) chưa? Nếu bố cục rời rạc, hãy vạch ra ngay.
2. Kiểm tra trùng lặp: Tìm các chữ, từ vựng hoặc dạng câu bị lặp lại quá nhiều lần gây nhàm chán (tất nhiên trừ phần lời điệp khúc lặp lại có chủ đích).
3. Đánh giá Flow & Vần: Cách gieo vần có gượng ép không? Câu có bị quá dài hoặc quá ngắn so với nhịp chung không?
Trả về kết quả dễ đọc dưới dạng gạch đầu dòng Markdown. Dùng các từ ngữ mạnh mẽ mang tính xây dựng.`;
    }

    return "Bạn là trợ lý AI.";
}

function getUserPrompt(request) {
    if (request.action === 'generate') return `Chủ đề bài hát: ${request.prompt}`;
    if (request.action === 'rhyme') return `Tìm vần ưu tiên ${request.type} cho từ/cụm từ gốc này: "${request.word}"`;
    if (request.action === 'suggest') {
        if (request.type === 'genre') {
            return `Hãy phân tích và cho tôi biết Thể loại nhạc (Style tags, mood, instruments, tempo) của bài hát này: "${request.context}". Làm ơn viết ra một chuỗi tags tiếng Anh hoàn chỉnh, ngăn cách bằng dấu phẩy để tôi chèn trực tiếp vào Suno AI.`;
        }
        let p = `Tôi cần trợ giúp động não (brainstorm). Xin gợi ý ${request.type}.`;
        if (request.context) p += `\nIdea/Thông tin bối cảnh ban đầu: ${request.context}`;
        if (request.lyricsContext) p += `\nĐây là lời bài hát mà tôi đã viết cho đến nay (hãy đọc để cảm nhận flow và vần điệu):\n${request.lyricsContext}`;
        return p;
    }
    if (request.action === 'analyze') return `Hãy soi lỗi và phân tích lời bài hát sau giúp tôi:\n\n${request.lyrics}`;
    return "Hello";
}

async function callGeminiAPI(apiKey, request) {
    // 1. Auto-detect best model allowed by the API Key
    let targetModel = 'models/gemini-1.5-flash';
    try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (listRes.ok) {
            const listData = await listRes.json();
            if (listData.models) {
                const avail = listData.models
                    .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
                    .map(m => m.name);
                
                const priorities = [
                    'models/gemini-1.5-flash', 
                    'models/gemini-1.5-flash-latest',
                    'models/gemini-1.5-pro', 
                    'models/gemini-1.5-pro-latest',
                    'models/gemini-1.5-flash-8b',
                    'models/gemini-pro',
                    'models/gemini-1.0-pro'
                ];
                
                let found = false;
                for (const p of priorities) {
                    if (avail.includes(p)) {
                        targetModel = p;
                        found = true;
                        break;
                    }
                }
                
                if (!found && avail.length > 0) {
                    const fallbackObj = avail.find(n => n.includes('gemini'));
                    if (fallbackObj) targetModel = fallbackObj;
                }
            }
        }
    } catch (e) {
        console.warn("Could not auto-fetch models, using fallback.", e);
    }

    // 2. Format the URL with the allowed model
    const url = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`;
    
    const systemInstruction = getSystemInstruction(request.action, request);
    const userPrompt = getUserPrompt(request);

    const payload = {
        contents: [
            { role: "user", parts: [{ text: userPrompt }] }
        ],
        // Note: system_instruction is supported natively in gemini-1.5. 
        // If the key falls back to 1.0, it might be ignored or throw an error depending on the v1beta state.
        system_instruction: {
            parts: [{ text: systemInstruction }]
        }
    };

    if (request.action === 'generate') {
         payload.generationConfig = { response_mime_type: "application/json" };
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorMsg = `API Error ${response.status}`;
        try {
            const errBody = await response.json();
            errorMsg = errBody.error?.message || errorMsg;
            if(errBody.error?.message?.includes("system_instruction")) {
                errorMsg += " (Model này không hỗ trợ lệnh hệ thống - system_instruction)";
            }
        } catch(e) {}
        throw new Error(`[Model ${targetModel}] ` + errorMsg);
    }

    const data = await response.json();
    try {
        const textContent = data.candidates[0].content.parts[0].text;
        
        if (request.action === 'generate') {
             const parsedData = JSON.parse(textContent);
             if (!parsedData.style_tags || !parsedData.lyrics) throw new Error("Format JSON lỗi");
             return parsedData;
        } else {
             return textContent; // Trả về Markdown
        }
    } catch (e) {
        throw new Error("Không thể xử lý phản hồi từ AI.");
    }
}
