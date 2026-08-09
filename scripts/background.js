importScripts('suno_format.js');

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
        return `Bạn là producer, songwriter và prompt engineer cho Suno AI. Hãy tạo prompt làm nhạc nghe như được sáng tác, phối khí, biểu diễn, thu âm, mix và master bởi con người.

Luôn suy luận các lớp: composition, arrangement, performance, instrument/source timbre, recording space, mix, master/tonal finish, và vocal/lyrics nếu có lời.

Phân loại ngầm từ yêu cầu: vocal hay instrumental, genre/subgenre, mood, BPM/tempo feel, instruments, groove/rhythmic identity, energy curve, production era/aesthetic, tonal target warm/neutral/bright. Tự suy luận chi tiết hợp lý, đừng hỏi lại.

Yêu cầu nhạc tính:
- Tạo hook/motif/riff/progression/groove rõ ràng khi phù hợp, lặp lại có biến hóa thay vì các đoạn rời rạc.
- Humanize đúng thể loại: micro-timing, velocity variation, phrasing, articulation, attacks/decays, ensemble interaction. Không làm nhạc công cố tình cẩu thả.
- Arrangement có tương phản: intro thưa, layering, breakdown, cut drum/bass, silence ngắn, đổi register, climax có chuẩn bị. Tránh loudness tối đa liên tục.
- Tonal realism là bắt buộc: source believable, rich low-mid body, smooth upper mids, controlled treble, rounded but articulate transients, realistic depth, restrained compression, dynamic range, subtle analog/tape-like saturation khi phù hợp. Punchy không được brittle.

Instrumental:
- Lyrics phải là full-song arrangement map bằng bracketed tags, không có prose để hát.
- Không được trả về chỉ các tag cấm vocal. Phải viết 8-12 sections phủ toàn bộ bản nhạc: [Intro], [Main Motif], [Verse/Theme A], [Build], [Drop/Chorus/Theme B], [Breakdown], [Variation], [Final Drop/Final Theme], [Outro] hoặc cấu trúc tương đương đúng thể loại.
- Mỗi section cần 1-3 dòng mô tả cụ thể bằng tiếng Anh về nhạc cụ, groove, motif/hook, energy, dynamics, register, fills, transitions, tonal/room character. Ví dụ: [Intro]\n[Instrumental]\n(Close-miked muted guitar states the two-note motif over soft brush percussion; warm room reflections, restrained low end.)
- Bắt buộc đưa các tag: [Instrumental], [No Vocals], [No Singing], [No Spoken Words]. Thêm [No Choir] hoặc [No Vocal Chops] nếu cần.

Vocal:
- Viết complete singable lyrics cho cả bài, không chỉ outline. Tối thiểu gồm [Intro], 2 verses, [Pre-Chorus] khi phù hợp, [Chorus] có hook rõ, [Bridge] hoặc [Breakdown], final chorus/outro.
- Mỗi verse nên có nhiều dòng lyric cụ thể, có hình ảnh đời thật và subtext; chorus phải có hook nhớ được; section tags có thể kèm performance direction ngắn.
- Tránh perfect rhyme máy móc, line length đều tăm tắp, cliché, metaphor chồng chất, từ gượng để lấy vần.
- Thiết kế singer: register phù hợp, phrasing tự nhiên, breath, selective vibrato, natural register transitions, varied phrase endings, controlled sibilance, chest/body resonance.

STYLE OF MUSIC: tối đa 1000 ký tự, tốt nhất 650-900. Dùng cho sonic DNA: genre, tempo, mood, instruments, rhythm, vocal identity nếu có, performance, tonal/recording, mix/master. Không lặp chi tiết arrangement đã có trong lyrics.

EXCLUDE STYLES: luôn tạo loại trừ có chọn lọc, chỉ loại các xung đột như brittle highs, harsh treble, piercing upper mids, glassy sound, metallic transients, digital harshness, hyped top end, thin mix, sterile production, harsh cymbals, brittle hi-hats, synthetic timbre, excessive widening, over-compression, brickwall limiting. Không loại trừ core genre/trait người dùng yêu cầu.

TRẢ VỀ DUY NHẤT JSON hợp lệ theo schema:
{
  "style_of_music": "string under 1000 characters",
  "lyrics": "string",
  "exclude_styles": "string",
  "production_notes": "string"
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
  [STYLE]STYLE OF MUSIC tiếng Anh, tối đa 1000 ký tự: genre/subgenre, BPM/tempo feel, mood, instruments, rhythmic identity, performance character, tonal/recording/mix/master character[/STYLE]
  [LYRICS]
  cấu trúc lời bài hát hoặc arrangement map nhạc đệm. Với instrumental phải có [Instrumental], [No Vocals], [No Singing], [No Spoken Words] và không có prose để hát. LƯU Ý: TOÀN BỘ NỘI DUNG TRONG THẺ [LYRICS] (bao gồm cả ghi chú, hướng dẫn cảm xúc, nhạc cụ) PHẢI ĐƯỢC VIẾT BẰNG TIẾNG ANH 100% để tối ưu cho hệ thống Suno.
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
        if (data?.mode === 'features') {
            return `Bạn là một chuyên gia âm nhạc và producer. Người dùng cung cấp metadata và đặc trưng âm thanh được extension trích xuất cục bộ từ file, không phải raw audio.
Nhiệm vụ: Suy luận mood, vibe, tempo feel, năng lượng, texture, tonal balance, dynamics, rhythmic character, nhạc cụ, kiểu bass/low-end và style phù hợp cho Suno AI từ dữ liệu đó.
Yêu cầu:
- Nói rõ các nhận định là suy luận từ đặc trưng âm thanh cục bộ, tránh khẳng định quá mức nếu dữ liệu không đủ.
- Trình bày gọn, dễ đọc bằng tiếng Việt.
- BẮT BUỘC có các mục riêng: Mood & Vibe, Tempo/Groove, Nhạc cụ & Texture, Bass / Low-end, Dấu hiệu Amapiano/Afro, Style cho Suno.
- Ở mục Nhạc cụ & Texture: suy luận keys/piano/guitar/pad/vocal/percussion nếu dữ liệu gợi ý, và ghi mức chắc chắn khi cần.
- Ở mục Bass / Low-end: phân biệt sub/808, bass guitar, synth bass, rounded bass, hoặc percussive log-drum bass; mô tả quan hệ kick-bass nếu có thể.
- Không nhắc Amapiano/log-drum nếu genreCues.amapianoLogDrum.score dưới 0.45 hoặc evidence rỗng.
- Nếu genreCues.amapianoLogDrum.score từ 0.45 đến dưới 0.65, chỉ ghi "có dấu hiệu nhẹ/cần kiểm chứng" và nêu bằng chứng.
- Chỉ mô tả log-drum/amapiano rõ khi genreCues.amapianoLogDrum.score từ 0.65 trở lên.
- Ở mục Dấu hiệu Amapiano/Afro: nếu đủ chứng cứ, kiểm tra log-drum bass, syncopated percussion, shaker/clave feel, airy keys/pads, double-time groove; nếu không đủ, nói ngắn rằng dữ liệu chưa ủng hộ.
- BẮT BUỘC cung cấp chính xác thẻ STYLE OF MUSIC tiếng Anh tối ưu cho Suno AI ở định dạng:
  [STYLE]genre/subgenre or close style family, BPM/tempo feel, mood, instruments/texture, bass type/low-end behavior, rhythmic identity including amapiano/Afro cues if present, performance character, tonal/recording/mix/master character; tối đa 1000 ký tự[/STYLE]
- Đi thẳng vào kết quả, không chào hỏi.`;
        }

        return `Bạn là một chuyên gia âm nhạc hàng đầu và nhà sản xuất âm nhạc kỳ cựu.
Nhiệm vụ: Phân tích bài hát hoặc tệp âm thanh được cung cấp để trích xuất: Mood (cảm xúc), Vibe (không gian nhạc), Thể loại cụ thể (Genre), Nhạc cụ chủ đạo, Tempo (tốc độ), performance character, tonal/recording/mix/master character.
Yêu cầu trình bày:
- Trình bày dạng danh sách gạch đầu dòng rõ ràng, trực quan bằng tiếng Việt.
- BẮT BUỘC cung cấp chính xác thẻ STYLE OF MUSIC tiếng Anh tối ưu cho Suno AI ở định dạng sau ở cuối câu trả lời:
  [STYLE]genre/subgenre, BPM/tempo feel, mood, instruments, rhythmic identity, performance character, tonal/recording/mix/master character; tối đa 1000 ký tự[/STYLE]
  Ví dụ: [STYLE]warm indie pop, 96 bpm relaxed pocket, close intimate vocal, brushed drums, rounded bass, natural room depth, smooth upper mids, controlled treble, restrained compression[/STYLE]
- Đi thẳng vào phân tích chi tiết, không chào hỏi dông dài.`;
    }

    return "Bạn là trợ lý AI.";
}

function getUserPrompt(request) {
    if (request.action === 'generate') return `Chủ đề bài hát: ${request.prompt}`;
    if (request.action === 'rhyme') return `Tìm vần ưu tiên ${request.type} cho từ/cụm từ gốc này: "${request.word}"`;
    if (request.action === 'suggest') {
        if (request.type === 'genre') {
            return `Hãy phân tích Thể loại nhạc (Style of Music, mood, instruments, tempo, performance, tonal/recording character) của bài hát này: "${request.context}". Vui lòng đưa ra 2 lựa chọn (Có lời và Nhạc không lời) theo đúng định dạng [STYLE]...[/STYLE] và [LYRICS]...[/LYRICS] đã yêu cầu.`;
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
        if (request.mode === 'features') {
            return `Hãy phân tích file nhạc "${request.fileName || 'không rõ tên'}" dựa trên Đặc trưng âm thanh JSON sau. Ưu tiên nhận diện nhạc cụ, kiểu bass/low-end, groove và dấu hiệu Amapiano/log-drum nếu có. Hãy suy luận thận trọng và tạo [STYLE] dùng được cho Suno AI:\n\n${JSON.stringify(request.audioProfile || {}, null, 2)}`;
        }
        return `Hãy phân tích đoạn nhạc này.`;
    }
    return "Hello";
}

function normalizeApiError(error) {
    const message = error?.message || String(error || '');
    if (message.includes('Failed to fetch')) {
        return new Error('Không kết nối được API 302.ai. Hãy reload extension, kiểm tra mạng/API key, rồi thử lại.');
    }
    if (/Parameter error/i.test(message)) {
        return new Error('API từ chối tham số audio. Extension đã chuyển file không tương thích sang WAV; nếu vẫn lỗi, hãy kiểm tra model audio/API key 302.ai hoặc thử MP3/WAV ngắn hơn.');
    }
    return error instanceof Error ? error : new Error(message || 'Lỗi API không xác định.');
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
        ? ['gpt-audio-1.5', 'gpt-audio', 'gpt-audio-mini', 'gpt-4o-audio-preview']
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
                     return normalizeGeneratedSong(parsedData);
                } else {
                     return textContent; // Trả về Markdown cho các chức năng khác
                }

            } catch (e) {
                lastError = e;
                if (e.message.includes("API Key không hợp lệ") || e.message.includes("lỗi cấu hình")) {
                    throw lastError; // Lỗi xác thực nghiêm trọng -> Dừng luôn
                }
                if (e.message.includes("Format JSON lỗi") || e.message.includes("Failed to fetch")) {
                    lastError = normalizeApiError(e);
                    break; // Format lỗi thì break loop nhỏ để đổi model khác, hoặc network đứt thì cũng thử model khác
                } else if (!e.message.includes("Model ")) {
                     break; 
                }
                
                throw lastError;
            }
        } // End of inner retry loop
    } // End of outer model loop

    if (lastError) {
        throw normalizeApiError(lastError);
    }
    throw new Error("Tất cả các mô hình (models) đều bị lỗi hoặc quá tải. Hãy thử lại sau.");
}

if (typeof module !== 'undefined') {
    module.exports = { getSystemInstruction };
}
