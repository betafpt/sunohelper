chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleOpenAIAction(request)
        .then(data => sendResponse({ success: true, data: data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Giữ channel mở để xử lý Async
});

async function handleOpenAIAction(request) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openaiApiKey'], async (result) => {
            if (!result.openaiApiKey) {
                reject(new Error('Chưa thiết lập API Key. Vui lòng mở tiện ích và điền Key.'));
                return;
            }

            try {
                const response = await callOpenAIAPI(result.openaiApiKey, request);
                resolve(response);
            } catch (error) {
                reject(error);
            }
        });
    });
}

function getSystemInstruction(action, data) {
    if (action === 'generate') {
        return `Bạn là một nhà sản xuất âm nhạc và nhạc sĩ chuyên viết lời bài hát hợp thị hiếu cho Suno AI.
Nhiệm vụ: Viết Lời bài hát (Lyrics) và Thẻ phong cách (Style tags) dựa trên ý tưởng của người dùng.

Yêu cầu bắt buộc:
1. NẾU LÀ NHẠC CÓ LỜI (Ví dụ có pop, rap, ballad,...): Lời bài hát phải có cấu trúc chuẩn, chia rõ ràng các phần: [Intro], [Verse], [Chorus], [Bridge], [Outro]. Lời bài hát phải có vần điệu, nhịp nhàng.
2. NẾU LÀ NHẠC KHÔNG LỜI (Instrumental / Beat / Không lời): Tuyệt đối KHÔNG viết lời hát (từ ngữ ca hát) có nghĩa. Chỉ được viết CẤU TRÚC (ví dụ: [Instrumental Intro], [Drop], [Build Up]) kết hợp với mô tả nhạc cụ, luồng cảm xúc bằng TIẾNG ANH trong ngoặc đơn. Ví dụ:
[Intro]
(Atmospheric synth pad, slow build up, lo-fi beats)

[Chorus]
(Heavy bassline, energetic electronic melody, no vocals)
3. Style tags: dưới 120 ký tự, ngắn gọn, phân tách bằng dấu phẩy. Bạn cũng phải tự động thêm chữ 'instrumental' vào đầu Style tags nếu nhận diện yêu cầu là nhạc không lời.

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
- Nếu user cần 'genre' (thể loại): Hãy phân tích ngắn gọn, sau đó BẮT BUỘC đưa ra 2 lựa chọn (Ví dụ: Lựa chọn 1: Có lời, Lựa chọn 2: Nhạc không lời). Dưới mỗi lựa chọn, BẮT BUỘC cung cấp chính xác 2 thẻ sau:
  [STYLE]chuỗi tags tiếng anh, phân cách bằng dấu phẩy[/STYLE]
  [LYRICS]
  cấu trúc lời bài hát hoặc cấu trúc nhạc đệm (ví dụ: [Verse], [Chorus], [Instrumental Drop]...). LƯU Ý: TOÀN BỘ NỘI DUNG TRONG THẺ [LYRICS] (bao gồm cả ghi chú, hướng dẫn cảm xúc, nhạc cụ) PHẢI ĐƯỢC VIẾT BẰNG TIẾNG ANH 100% để tối ưu cho hệ thống Suno.
  [/LYRICS]
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

    if (action === 'analyze_audio') {
        return `Bạn là một chuyên gia âm nhạc hàng đầu và nhà sản xuất âm nhạc kỳ cựu.
Nhiệm vụ: Phân tích bài hát hoặc tệp âm thanh được cung cấp để trích xuất: Mood (cảm xúc), Vibe (không gian nhạc), Thể loại cụ thể (Genre), Nhạc cụ chủ đạo, và Tempo (tốc độ).
Yêu cầu trình bày:
- Trình bày dạng danh sách gạch đầu dòng rõ ràng, trực quan bằng tiếng Việt.
- BẮT BUỘC cung cấp chính xác thẻ Style Tags tiếng Anh tối ưu cho Suno AI ở định dạng sau ở cuối câu trả lời:
  [STYLE]chuỗi tags tiếng anh, phân cách bằng dấu phẩy, dưới 120 ký tự[/STYLE]
  Ví dụ: [STYLE]pop, energetic, synth, bright, 120 bpm[/STYLE]
- Đi thẳng vào phân tích chi tiết, không chào hỏi dông dài.`;
    }

    return "Bạn là trợ lý AI.";
}

function getUserPrompt(request) {
    if (request.action === 'generate') return `Chủ đề bài hát: ${request.prompt}`;
    if (request.action === 'rhyme') return `Tìm vần ưu tiên ${request.type} cho từ/cụm từ gốc này: "${request.word}"`;
    if (request.action === 'suggest') {
        if (request.type === 'genre') {
            return `Hãy phân tích Thể loại nhạc (Style tags, mood, instruments, tempo) của bài hát này: "${request.context}". Vui lòng đưa ra 2 lựa chọn (Có lời và Nhạc không lời) theo đúng định dạng [STYLE]...[/STYLE] và [LYRICS]...[/LYRICS] đã yêu cầu.`;
        }
        let p = `Tôi cần trợ giúp động não (brainstorm). Xin gợi ý ${request.type}.`;
        if (request.context) p += `\nIdea/Thông tin bối cảnh ban đầu: ${request.context}`;
        if (request.lyricsContext) p += `\nĐây là lời bài hát mà tôi đã viết cho đến nay (hãy đọc để cảm nhận flow và vần điệu):\n${request.lyricsContext}`;
        return p;
    }
    if (request.action === 'analyze') return `Hãy soi lỗi và phân tích lời bài hát sau giúp tôi:\n\n${request.lyrics}`;
    if (request.action === 'analyze_audio') {
        if (request.mode === 'youtube') {
            return `Hãy phân tích bài hát có tiêu đề "${request.title}"${request.author ? ` của tác giả "${request.author}"` : ''}. Đường dẫn: ${request.url}`;
        }
        return `Hãy phân tích đoạn nhạc này.`;
    }
    return "Hello";
}

async function callOpenAIAPI(apiKey, request) {
    // 1. Auto-detect best model allowed by the API Key
    let availableModels = [];
    try {
        const listRes = await fetch('https://api.302.ai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (listRes.ok) {
            const listData = await listRes.json();
            if (listData.data) {
                availableModels = listData.data.map(m => m.id);
            }
        }
    } catch (e) {
        console.warn("Could not auto-fetch models, using fallback.", e);
    }

    const priorities = (request.action === 'analyze_audio' && request.mode === 'file')
        ? ['gpt-4o-audio-preview']
        : [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-3.5-turbo'
        ];

    let candidatesToTry = [];
    if (availableModels.length > 0) {
        for (const p of priorities) {
            if (availableModels.includes(p)) {
                candidatesToTry.push(p);
            }
        }
        // Vét cạn tất cả các model gpt khác làm dự phòng cuối cùng (chỉ áp dụng nếu không phải mode file audio)
        if (!(request.action === 'analyze_audio' && request.mode === 'file')) {
            for (const m of availableModels) {
                if (m.startsWith('gpt-') && !candidatesToTry.includes(m)) {
                    candidatesToTry.push(m);
                }
            }
        }
    } else {
        candidatesToTry = priorities;
    }

    // Nếu là chế độ file audio và candidatesToTry rỗng (availableModels có giá trị nhưng không có gpt-4o-audio-preview)
    // Thì vẫn cố thử gpt-4o-audio-preview
    if (candidatesToTry.length === 0 && request.action === 'analyze_audio' && request.mode === 'file') {
        candidatesToTry = ['gpt-4o-audio-preview'];
    }

    const systemInstruction = getSystemInstruction(request.action, request);
    const userPrompt = getUserPrompt(request);

    let lastError = null;

    // Helper sleep để delay vài giây trước khi retry
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Iterate qua từng model trong danh sách candidates
    for (let i = 0; i < candidatesToTry.length; i++) {
        const targetModel = candidatesToTry[i];
        const url = 'https://api.302.ai/v1/chat/completions';

        let payload = {
            model: targetModel,
            messages: [
                { role: "system", content: systemInstruction }
            ]
        };

        if (request.action === 'analyze_audio' && request.mode === 'file') {
            payload.messages.push({
                role: "user",
                content: [
                    { type: "text", text: userPrompt },
                    { 
                        type: "input_audio", 
                        input_audio: { 
                            data: request.audioData, 
                            format: request.format 
                        } 
                    }
                ]
            });
            payload.modalities = ["text"];
        } else {
            payload.messages.push({ role: "user", content: userPrompt });
            if (request.action === 'generate') {
                 payload.response_format = { type: "json_object" };
            }
        }

        // Thử tối đa 3 lần cho MỖI model (retry 2 lần nếu bị quá tải tạm thời với backoff)
        let maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    let errorMsg = `API Error ${response.status}`;
                    let isTransient = false;
                    try {
                        const errBody = await response.json();
                        errorMsg = errBody.error?.message || errorMsg;
                    } catch(e) {}
                    
                    lastError = new Error(`[Model ${targetModel}] ` + errorMsg);
                    
                    // Error 401: Invalid API Key -> Lỗi nghiêm trọng, dừng ngay lập tức
                    if (response.status === 401) {
                        throw new Error('API Key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại cấu hình.');
                    }

                    // Error 429 (Rate Limit), 503, 500, 502, 504 -> Tạm thời
                    if (response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504 || errorMsg.includes('rate limit') || errorMsg.includes('overloaded')) {
                        isTransient = true;
                    }

                    if (isTransient) {
                        if (attempt < maxRetries) {
                            await sleep(2500 * attempt); // Đợi 2.5s rồi 5s rồi retry
                            continue;
                        } else {
                            // Hết lượt retry cho model này, break loop nhỏ để chuyển sang model kế tiếp
                            break;
                        }
                    } else if (response.status === 404 || errorMsg.includes('not found') || errorMsg.includes('not supported') || response.status === 403) {
                        // Model không khả dụng với tài khoản này -> Chuyển sang model khác
                        break; 
                    } else {
                        // Lỗi cấu trúc (400) hoặc lỗi khác không thể retry -> Ném lỗi ra ngoài luôn
                        throw lastError; 
                    }
                }

                const data = await response.json();
                const textContent = data.choices[0].message.content;
                
                if (request.action === 'generate') {
                     const parsedData = JSON.parse(textContent);
                     if (!parsedData.style_tags || !parsedData.lyrics) throw new Error("Format JSON lỗi");
                     return parsedData;
                } else {
                     return textContent; // Trả về Markdown cho các chức năng khác
                }

            } catch (e) {
                lastError = e;
                if (e.message.includes("API Key không hợp lệ") || e.message.includes("lỗi cấu hình")) {
                    throw lastError; // Lỗi xác thực nghiêm trọng -> Dừng luôn
                }
                if (e.message.includes("Format JSON lỗi") || e.message.includes("Failed to fetch")) {
                    break; // Format lỗi thì break loop nhỏ để đổi model khác, hoặc network đứt thì cũng thử model khác
                } else if (!e.message.includes("Model ")) {
                     break; 
                }
                
                throw lastError;
            }
        } // End of inner retry loop
    } // End of outer model loop

    if (lastError) {
        throw lastError;
    }
    throw new Error("Tất cả các mô hình (models) đều bị lỗi hoặc quá tải. Hãy thử lại sau.");
}
