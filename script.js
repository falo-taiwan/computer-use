// Script for LINE Anti-Ban Message Mutator App

// Synonyms Dictionary for Non-AI substitution
const synonyms = {
    '提供': ['供應', '給予', '為您準備', '推介'],
    '產品': ['商品', '品項', '好物', '服務'],
    '立刻': ['馬上', '即刻', '迅速', '火速'],
    '協助': ['幫忙', '協助', '支援', '指引'],
    '期待': ['期盼', '盼望', '靜候', '歡迎'],
    '訊息': ['消息', '內容', '資訊', '通知'],
    '聯絡': ['聯繫', '聯絡', '對接', '找我'],
    '免費': ['贈送', '零元', '免單', '免費'],
    '專案': ['項目', '計畫', '案子', '推廣案'],
    '推薦': ['推介', '力推', '首選', '推介'],
    '活動': ['企劃', '盛事', '聚會', '項目'],
    '獲得': ['領取', '得到', '享有', '獲取'],
    '機會': ['機遇', '時機', '契機'],
    '分享': ['轉發', '傳遞', '分享']
};

// Homoglyph Map for visual character variation
const homoglyphMap = {
    'a': 'а', 'c': 'с', 'e': 'е', 'i': 'і', 'j': 'ј', 'o': 'о', 'p': 'р', 's': 'ѕ', 'x': 'х', 'y': 'у',
    'A': 'А', 'B': 'В', 'C': 'С', 'E': 'Е', 'H': 'Н', 'I': 'І', 'J': 'Ј', 'K': 'К', 'M': 'М', 'O': 'О',
    'P': 'Р', 'S': 'Ѕ', 'T': 'Т', 'X': 'Х', 'Y': 'Ү', '0': '０', '1': '１', '2': '２', '3': '３', '4': '４',
    '5': '５', '6': '６', '7': '７', '8': '８', '9': '９', ':': '：'
};

// Default Text Pools for prefix, suffix, and quotes
const defaultPrefixes = [
    '【活動快訊】',
    '哈囉！',
    '大家早安～',
    '打擾一下：',
    '分享一個好消息：',
    '✨ 專屬好康：',
    '哈囉，打擾了～',
    '好消息播報！',
    '【通知】'
];

const defaultSuffixes = [
    '祝您順心！',
    '祝您有美好的一天！',
    '辛苦了，謝謝！',
    '感恩！',
    '有任何疑問歡迎隨時跟我聯絡喔！',
    '期待您的參與！',
    '祝大家平安喜樂！'
];

const defaultQuotes = [
    '（今天也是充滿希望的一天！）',
    '（熱愛生活，珍惜當下。）',
    '（多喝水，注意身體健康喔！）',
    '（祝大家今天都有好心情～）',
    '（保持微笑，陽光總在風雨後。）',
    '（每天進步一點點，未來就會大不同。）',
    '（順手分享，給身邊人帶來溫暖。）',
    '（細節決定成敗，態度決定高度。）'
];

// Global State
let generatedVariants = [];
let currentActiveTab = 'tab-non-ai';
let currentTheme = 'fresh';

// FNV-1a Hash Implementation
function calculateHash(str) {
    if (!str) return '0x00000000';
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return "0x" + (h >>> 0).toString(16).toUpperCase();
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const inputMessage = document.getElementById('input-message');
    const charCounter = document.getElementById('char-counter');
    const origHash = document.getElementById('orig-hash');
    const variantCountSlider = document.getElementById('variant-count');
    const variantCountVal = document.getElementById('variant-count-val');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const btnGenerate = document.getElementById('btn-generate');
    const btnClearInput = document.getElementById('btn-clear-input');
    const emptyState = document.getElementById('empty-state');
    const skeletonContainer = document.getElementById('skeleton-container');
    const resultsList = document.getElementById('results-list');
    const resultsCount = document.getElementById('results-count');
    const resultsActions = document.getElementById('results-actions');
    const toggleZwsVisibility = document.getElementById('toggle-zws-visibility');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const toast = document.getElementById('toast');

    // AI Form Elements
    const apiKeyInput = document.getElementById('api-key');
    const btnToggleKey = document.getElementById('btn-toggle-key');
    const aiModelSelect = document.getElementById('ai-model');
    const customModelInput = document.getElementById('custom-model-input');
    const aiToneSelect = document.getElementById('ai-tone');
    const optHybrid = document.getElementById('opt-hybrid');

    // Non-AI Checkbox Options
    const optZws = document.getElementById('opt-zws');
    const optPunctuation = document.getElementById('opt-punctuation');
    const optEmoji = document.getElementById('opt-emoji');
    const optSalutation = document.getElementById('opt-salutation');
    const optSynonyms = document.getElementById('opt-synonyms');
    const optWidth = document.getElementById('opt-width');
    const optInterleave = document.getElementById('opt-interleave');
    const optNoiseQuote = document.getElementById('opt-noise-quote');
    const optTimestamp = document.getElementById('opt-timestamp');

    // Advanced Text pools Collapsible
    const btnToggleAdvanced = document.getElementById('btn-toggle-advanced');
    const advancedSettingsPanel = document.getElementById('advanced-settings-panel');
    const customPrefixes = document.getElementById('custom-prefixes');
    const customSuffixes = document.getElementById('custom-suffixes');
    const customQuotes = document.getElementById('custom-quotes');

    // Simulator controls
    const btnStartSim = document.getElementById('btn-start-sim');
    const btnPauseSim = document.getElementById('btn-pause-sim');
    const btnStopSim = document.getElementById('btn-stop-sim');
    const simScenarioSelect = document.getElementById('sim-scenario');
    const simHud = document.getElementById('sim-hud');
    const simHudBody = document.getElementById('sim-hud-body');
    const simHudStatus = document.getElementById('sim-hud-status');
    const virtualCursor = document.getElementById('virtual-cursor');
    const clickRipple = document.getElementById('click-ripple');

    // Theme Toggle Function
    function setTheme(theme) {
        currentTheme = theme;
        if (theme === 'cyber') {
            document.body.classList.add('theme-dark-cyber');
            document.getElementById('theme-btn-cyber').classList.add('active');
            document.getElementById('theme-btn-fresh').classList.remove('active');
        } else {
            document.body.classList.remove('theme-dark-cyber');
            document.getElementById('theme-btn-fresh').classList.add('active');
            document.getElementById('theme-btn-cyber').classList.remove('active');
        }
    }

    // Bind Theme Buttons
    document.getElementById('theme-btn-fresh').addEventListener('click', () => {
        setTheme('fresh');
        saveAppState();
    });
    document.getElementById('theme-btn-cyber').addEventListener('click', () => {
        setTheme('cyber');
        saveAppState();
    });

    // Save and Load App State to/from localStorage
    function saveAppState() {
        const state = {
            inputMessage: inputMessage.value,
            variantCount: variantCountSlider.value,
            currentActiveTab: currentActiveTab,
            currentTheme: currentTheme,
            opts: {
                zws: optZws.checked,
                punctuation: optPunctuation.checked,
                emoji: optEmoji.checked,
                salutation: optSalutation.checked,
                synonyms: optSynonyms.checked,
                width: optWidth.checked,
                interleave: optInterleave.checked,
                noiseQuote: optNoiseQuote.checked,
                timestamp: optTimestamp.checked,
                hybrid: optHybrid.checked
            },
            geminiKey: apiKeyInput.value,
            geminiModel: aiModelSelect.value,
            geminiCustomModel: customModelInput.value,
            geminiTone: aiToneSelect.value,
            customPrefixes: customPrefixes.value,
            customSuffixes: customSuffixes.value,
            customQuotes: customQuotes.value
        };
        localStorage.setItem('line_mutator_state', JSON.stringify(state));
    }

    function loadAppState() {
        // First restore advanced lists if they were saved individually in old code format
        customPrefixes.value = localStorage.getItem('custom_prefixes') || defaultPrefixes.join('\n');
        customSuffixes.value = localStorage.getItem('custom_suffixes') || defaultSuffixes.join('\n');
        customQuotes.value = localStorage.getItem('custom_quotes') || defaultQuotes.join('\n');

        // Restore api key and theme individually from old format if needed
        if (localStorage.getItem('gemini_api_key')) {
            apiKeyInput.value = localStorage.getItem('gemini_api_key');
        }
        if (localStorage.getItem('gemini_model')) {
            aiModelSelect.value = localStorage.getItem('gemini_model');
            if (aiModelSelect.value === 'custom') {
                customModelInput.classList.remove('hidden');
                customModelInput.value = localStorage.getItem('gemini_custom_model') || '';
            }
        }
        if (localStorage.getItem('gemini_tone')) {
            aiToneSelect.value = localStorage.getItem('gemini_tone');
        }

        // Load complete state package if exists
        const saved = localStorage.getItem('line_mutator_state');
        if (!saved) {
            // Set default theme to fresh if no state is saved
            setTheme('fresh');
            return;
        }
        
        try {
            const state = JSON.parse(saved);
            
            // Restore input message & counter
            if (state.inputMessage !== undefined) {
                inputMessage.value = state.inputMessage;
                charCounter.textContent = `${inputMessage.value.length} 字`;
                origHash.textContent = `Hash: ${calculateHash(inputMessage.value)}`;
            }
            
            // Restore variant count
            if (state.variantCount !== undefined) {
                variantCountSlider.value = state.variantCount;
                variantCountVal.textContent = `${variantCountSlider.value} 個`;
            }
            
            // Restore active tab
            if (state.currentActiveTab !== undefined) {
                currentActiveTab = state.currentActiveTab;
                tabBtns.forEach(b => {
                    const tabId = b.getAttribute('data-tab');
                    if (tabId === currentActiveTab) {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });
                tabContents.forEach(c => {
                    if (c.id === currentActiveTab) {
                        c.classList.add('active');
                    } else {
                        c.classList.remove('active');
                    }
                });
            }
            
            // Restore theme
            if (state.currentTheme !== undefined) {
                setTheme(state.currentTheme);
            } else {
                setTheme('fresh');
            }
            
            // Restore checkboxes
            if (state.opts) {
                if (state.opts.zws !== undefined) optZws.checked = state.opts.zws;
                if (state.opts.punctuation !== undefined) optPunctuation.checked = state.opts.punctuation;
                if (state.opts.emoji !== undefined) optEmoji.checked = state.opts.emoji;
                if (state.opts.salutation !== undefined) optSalutation.checked = state.opts.salutation;
                if (state.opts.synonyms !== undefined) optSynonyms.checked = state.opts.synonyms;
                if (state.opts.width !== undefined) optWidth.checked = state.opts.width;
                if (state.opts.interleave !== undefined) optInterleave.checked = state.opts.interleave;
                if (state.opts.noiseQuote !== undefined) optNoiseQuote.checked = state.opts.noiseQuote;
                if (state.opts.timestamp !== undefined) optTimestamp.checked = state.opts.timestamp;
                if (state.opts.hybrid !== undefined) optHybrid.checked = state.opts.hybrid;
            }
            
            // Restore Gemini AI fields
            if (state.geminiKey !== undefined) apiKeyInput.value = state.geminiKey;
            if (state.geminiModel !== undefined) {
                aiModelSelect.value = state.geminiModel;
                if (aiModelSelect.value === 'custom') {
                    customModelInput.classList.remove('hidden');
                    customModelInput.value = state.geminiCustomModel || '';
                } else {
                    customModelInput.classList.add('hidden');
                }
            }
            if (state.geminiTone !== undefined) aiToneSelect.value = state.geminiTone;

            // Restore custom text pools
            if (state.customPrefixes !== undefined) customPrefixes.value = state.customPrefixes;
            if (state.customSuffixes !== undefined) customSuffixes.value = state.customSuffixes;
            if (state.customQuotes !== undefined) customQuotes.value = state.customQuotes;

        } catch (e) {
            console.error('Failed to load state from localStorage:', e);
            setTheme('fresh');
        }
    }

    // Run Load State immediately on init
    loadAppState();

    // Advanced Panel Toggle
    btnToggleAdvanced.addEventListener('click', () => {
        btnToggleAdvanced.classList.toggle('open');
        advancedSettingsPanel.classList.toggle('hidden');
    });

    // Characters & Hash Counter
    inputMessage.addEventListener('input', () => {
        charCounter.textContent = `${inputMessage.value.length} 字`;
        origHash.textContent = `Hash: ${calculateHash(inputMessage.value)}`;
        saveAppState();
    });

    // Clear Button
    btnClearInput.addEventListener('click', () => {
        inputMessage.value = '';
        charCounter.textContent = '0 字';
        origHash.textContent = 'Hash: -';
        saveAppState();
        inputMessage.focus();
    });

    // Slider Counter Update
    variantCountSlider.addEventListener('input', () => {
        variantCountVal.textContent = `${variantCountSlider.value} 個`;
        saveAppState();
    });

    // Tab Toggle logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            currentActiveTab = tabId;
            saveAppState();
        });
    });

    // Toggle API Key visibility
    btnToggleKey.addEventListener('click', () => {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            btnToggleKey.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            btnToggleKey.title = '隱藏金鑰';
        } else {
            apiKeyInput.type = 'password';
            btnToggleKey.innerHTML = '<i class="fa-solid fa-eye"></i>';
            btnToggleKey.title = '顯示金鑰';
        }
    });

    // Custom model input display toggle
    aiModelSelect.addEventListener('change', () => {
        if (aiModelSelect.value === 'custom') {
            customModelInput.classList.remove('hidden');
            customModelInput.focus();
        } else {
            customModelInput.classList.add('hidden');
        }
        saveAppState();
    });

    // Custom model input edit
    customModelInput.addEventListener('input', () => {
        saveAppState();
    });

    // AI Tone change
    aiToneSelect.addEventListener('change', () => {
        saveAppState();
    });

    // Bind checkboxes to save state
    [optZws, optPunctuation, optEmoji, optSalutation, optSynonyms, optWidth, optInterleave, optNoiseQuote, optTimestamp, optHybrid].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            saveAppState();
        });
    });

    // Bind advanced textarea lists to save state
    [customPrefixes, customSuffixes, customQuotes].forEach(textarea => {
        textarea.addEventListener('input', () => {
            saveAppState();
        });
    });

    // Toggle Zero-Width Characters Display in preview list
    toggleZwsVisibility.addEventListener('change', () => {
        if (toggleZwsVisibility.checked) {
            resultsList.classList.add('show-zws');
        } else {
            resultsList.classList.remove('show-zws');
        }
    });

    // Generate Button handler
    btnGenerate.addEventListener('click', async (e) => {
        // If simulation is running and we are in AI scenario, let the simulator handle it
        if (isSimulating && simScenarioSelect.value === 'scenario-ai-hybrid') {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        const text = inputMessage.value.trim();
        if (!text) {
            showToast('請先輸入需要改寫的訊息內容！', 'warning');
            inputMessage.focus();
            return;
        }

        const count = parseInt(variantCountSlider.value, 10);
        generatedVariants = [];

        // Save current settings to localStorage
        saveAppState();


        // Parse custom text pools
        const prefixes = customPrefixes.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const suffixes = customSuffixes.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const quotes = customQuotes.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (currentActiveTab === 'tab-non-ai') {
            // Run Non-AI Algorithm
            btnGenerate.disabled = true;
            btnGenerate.querySelector('.btn-text').classList.add('hidden');
            btnGenerate.querySelector('.spinner').classList.remove('hidden');
            
            try {
                const options = {
                    zws: optZws.checked,
                    punctuation: optPunctuation.checked,
                    emoji: optEmoji.checked,
                    salutation: optSalutation.checked,
                    synonyms: optSynonyms.checked,
                    width: optWidth.checked,
                    interleave: optInterleave.checked,
                    noiseQuote: optNoiseQuote.checked,
                    timestamp: optTimestamp.checked,
                    prefixes: prefixes,
                    suffixes: suffixes,
                    quotes: quotes
                };

                // Generate variants sequentially
                for (let i = 0; i < count; i++) {
                    const variantText = mutateTextNonAI(text, options, i);
                    generatedVariants.push({
                        text: variantText,
                        similarity: calculateSimilarity(text, variantText)
                    });
                }
                
                renderResults();
                showToast(`成功生成 ${count} 個演算法變體！`, 'success');
            } catch (err) {
                console.error(err);
                showToast('生成過程出錯：' + err.message, 'danger');
            } finally {
                btnGenerate.disabled = false;
                btnGenerate.querySelector('.btn-text').classList.remove('hidden');
                btnGenerate.querySelector('.spinner').classList.add('hidden');
            }

        } else {
            // Run Gemini AI Mode
            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                showToast('使用 AI 模式需要填寫 Google API Key！', 'warning');
                apiKeyInput.focus();
                return;
            }

            const model = aiModelSelect.value === 'custom' ? customModelInput.value.trim() : aiModelSelect.value;
            if (!model) {
                showToast('請填寫自訂模型名稱！', 'warning');
                customModelInput.focus();
                return;
            }

            const tone = aiToneSelect.value;

            // Show Loading State
            emptyState.classList.add('hidden');
            resultsList.classList.add('hidden');
            resultsCount.classList.add('hidden');
            resultsActions.classList.add('hidden');
            skeletonContainer.classList.remove('hidden');
            btnGenerate.disabled = true;
            btnGenerate.querySelector('.btn-text').classList.add('hidden');
            btnGenerate.querySelector('.spinner').classList.remove('hidden');

            try {
                const aiRewrites = await fetchGeminiRewrites(text, count, apiKey, model, tone);
                
                aiRewrites.forEach((rewrittenText, idx) => {
                    let finalMutatedText = rewrittenText;
                    
                    // If hybrid mode is active, apply ZWS, Punctuation, Width and Timestamps on top of AI output
                    if (optHybrid.checked) {
                        const hybridOptions = {
                            zws: true,
                            punctuation: true,
                            emoji: false,
                            salutation: false,
                            synonyms: false,
                            width: optWidth.checked,
                            interleave: optInterleave.checked,
                            noiseQuote: optNoiseQuote.checked,
                            timestamp: optTimestamp.checked,
                            prefixes: [],
                            suffixes: [],
                            quotes: quotes
                        };
                        finalMutatedText = mutateTextNonAI(rewrittenText, hybridOptions, idx);
                    }

                    generatedVariants.push({
                        text: finalMutatedText,
                        similarity: calculateSimilarity(text, finalMutatedText)
                    });
                });

                renderResults();
                showToast(`AI 成功生成 ${generatedVariants.length} 個重寫變體！`, 'success');
            } catch (err) {
                console.error(err);
                skeletonContainer.classList.add('hidden');
                emptyState.classList.remove('hidden');
                showToast(err.message, 'danger');
            } finally {
                btnGenerate.disabled = false;
                btnGenerate.querySelector('.btn-text').classList.remove('hidden');
                btnGenerate.querySelector('.spinner').classList.add('hidden');
            }
        }
    });

    // Export CSV handler
    btnExportCsv.addEventListener('click', () => {
        if (generatedVariants.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for Chinese excel compatibility
        csvContent += "編號,長度,與原文相似度,變體內容\n";
        
        generatedVariants.forEach((variant, index) => {
            // Replace double quotes with escaped quotes
            const escapedText = variant.text.replace(/"/g, '""');
            csvContent += `${index + 1},${variant.text.length},${variant.similarity}%,"${escapedText}"\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "line_ban_prevention_variants.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV 匯出成功！', 'success');
    });

    // Render generated results to DOM
    function renderResults() {
        skeletonContainer.classList.add('hidden');
        emptyState.classList.add('hidden');
        resultsList.innerHTML = '';
        
        generatedVariants.forEach((variant, index) => {
            const card = document.createElement('div');
            card.className = 'variant-card';
            card.id = `variant-card-${index}`;
            
            // Format character visibility
            const formattedBody = formatTextWithZws(variant.text);
            const variantHash = calculateHash(variant.text);
            
            // Similarity color code
            let similarityClass = 'similarity-high';
            if (variant.similarity < 50) {
                similarityClass = 'similarity-low';
            } else if (variant.similarity < 85) {
                similarityClass = 'similarity-mid';
            }
            
            card.innerHTML = `
                <div class="variant-meta">
                    <span class="variant-index">#${index + 1} 號變體</span>
                    <div class="variant-stats">
                        <div class="stat-item"><i class="fa-solid fa-calculator"></i> ${variant.text.length} 字</div>
                        <div class="stat-item ${similarityClass}"><i class="fa-solid fa-code-compare"></i> 相似度: ${variant.similarity}%</div>
                        <div class="stat-item text-purple-400 font-mono"><i class="fa-solid fa-hashtag"></i> Hash: ${variantHash}</div>
                    </div>
                </div>
                <div class="variant-body">${formattedBody}</div>
                <div class="variant-footer">
                    <button class="btn btn-copy-variant" data-index="${index}"><i class="fa-regular fa-copy"></i> 複製內容</button>
                    <button class="btn btn-line-variant" data-index="${index}"><i class="fa-brands fa-line"></i> LINE 分送</button>
                </div>
            `;
            resultsList.appendChild(card);
        });

        // Add event listeners for variant buttons
        document.querySelectorAll('.btn-copy-variant').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                copyToClipboard(generatedVariants[index].text, index);
            });
        });

        document.querySelectorAll('.btn-line-variant').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                shareToLine(generatedVariants[index].text);
            });
        });

        resultsList.classList.remove('hidden');
        resultsCount.textContent = `共 ${generatedVariants.length} 個變體`;
        resultsCount.classList.remove('hidden');
        resultsActions.classList.remove('hidden');
    }

    // Copy to clipboard helper
    function copyToClipboard(text, index) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('已複製到剪貼簿，並標記為已使用！', 'success');
            
            // Mark card as used visually
            const card = document.getElementById(`variant-card-${index}`);
            if (card) {
                card.classList.add('used');
            }
        }).catch(err => {
            console.error('複製失敗: ', err);
            showToast('瀏覽器拒絕複製權限，請手動複製。', 'danger');
        });
    }

    // Share to LINE helper
    function shareToLine(text) {
        // LINE sharing URL scheme
        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
        window.open(lineUrl, '_blank');
    }

    // Toast Message Handler
    function showToast(message, type = 'success') {
        const icons = {
            'success': '<i class="fa-solid fa-circle-check"></i>',
            'warning': '<i class="fa-solid fa-circle-exclamation"></i>',
            'danger': '<i class="fa-solid fa-triangle-exclamation"></i>'
        };

        const bgColors = {
            'success': 'rgba(16, 185, 129, 0.95)',
            'warning': 'rgba(245, 158, 11, 0.95)',
            'danger': 'rgba(239, 68, 68, 0.95)'
        };

        toast.style.background = bgColors[type];
        toast.querySelector('.toast-icon').innerHTML = icons[type];
        toast.querySelector('.toast-message').textContent = message;
        
        toast.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // --- AGENT COMPUTER USE SIMULATION ENGINE ---
    let simSteps = [];
    let currentStepIdx = 0;
    let simPaused = false;
    let isSimulating = false;

    // Append Terminal Log helper
    function appendSimLog(html, className) {
        const div = document.createElement('div');
        div.className = className;
        div.innerHTML = html;
        simHudBody.appendChild(div);
        simHudBody.scrollTop = simHudBody.scrollHeight;
    }

    // Cursor position animation helper
    function moveCursorToElement(el, callback) {
        if (!el) {
            callback();
            return;
        }
        const rect = el.getBoundingClientRect();
        // Position mouse at element center in viewport
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        virtualCursor.style.left = `${x}px`;
        virtualCursor.style.top = `${y}px`;
        
        // Wait for cursor moving transition to complete
        setTimeout(callback, 800);
    }

    // Click effect helper
    function playClickAnimation(el) {
        clickRipple.classList.remove('animate');
        void clickRipple.offsetWidth; // trigger reflow
        clickRipple.classList.add('animate');
        
        if (el) {
            el.classList.add('sim-hover-target');
            setTimeout(() => el.classList.remove('sim-hover-target'), 600);
        }
    }

    // Keyboard type simulation helper
    function typeTextSimulation(el, text, callback) {
        if (!el) {
            callback();
            return;
        }
        el.focus();
        el.value = '';
        let idx = 0;
        
        function typeChar() {
            if (simPaused || !isSimulating) return;
            if (idx < text.length) {
                el.value += text[idx];
                el.dispatchEvent(new Event('input', { bubbles: true }));
                idx++;
                setTimeout(typeChar, 30); // 30ms typing speed
            } else {
                el.dispatchEvent(new Event('change', { bubbles: true }));
                callback();
            }
        }
        typeChar();
    }

    // Main steps runner
    function executeNextStep() {
        if (!isSimulating || simPaused) return;
        if (currentStepIdx >= simSteps.length) {
            endSimulation(true);
            return;
        }
        
        const step = simSteps[currentStepIdx];
        currentStepIdx++;
        
        // Resolve target node
        let targetEl = null;
        if (step.target) {
            if (typeof step.target === 'function') {
                targetEl = step.target();
            } else {
                targetEl = document.querySelector(step.target);
            }
        }
        
        switch (step.type) {
            case 'thought':
                appendSimLog(`Thought: ${step.text}`, 'sim-log-thought');
                setTimeout(executeNextStep, 800);
                break;
            case 'tool_call':
                appendSimLog(`Tool Call: ${step.text}`, 'sim-log-tool-call');
                setTimeout(executeNextStep, 500);
                break;
            case 'result':
                appendSimLog(`Result: ${step.text}`, 'sim-log-result');
                setTimeout(executeNextStep, 800);
                break;
            case 'move':
                if (targetEl) {
                    moveCursorToElement(targetEl, () => {
                        setTimeout(executeNextStep, 300);
                    });
                } else {
                    setTimeout(executeNextStep, 100);
                }
                break;
            case 'click':
                if (targetEl) {
                    moveCursorToElement(targetEl, () => {
                        playClickAnimation(targetEl);
                        targetEl.click();
                        // Special trigger tab content visually
                        if (targetEl.classList.contains('tab-btn')) {
                            targetEl.dispatchEvent(new Event('click', { bubbles: true }));
                        }
                        setTimeout(executeNextStep, 700);
                    });
                } else {
                    setTimeout(executeNextStep, 100);
                }
                break;
            case 'type':
                if (targetEl) {
                    moveCursorToElement(targetEl, () => {
                        typeTextSimulation(targetEl, step.text, () => {
                            setTimeout(executeNextStep, 500);
                        });
                    });
                } else {
                    setTimeout(executeNextStep, 100);
                }
                break;
            case 'slider':
                if (targetEl) {
                    moveCursorToElement(targetEl, () => {
                        targetEl.value = step.value;
                        targetEl.dispatchEvent(new Event('input', { bubbles: true }));
                        targetEl.dispatchEvent(new Event('change', { bubbles: true }));
                        setTimeout(executeNextStep, 600);
                    });
                } else {
                    setTimeout(executeNextStep, 100);
                }
                break;
            case 'checkbox':
                if (targetEl) {
                    moveCursorToElement(targetEl, () => {
                        if (targetEl.checked !== step.value) {
                            targetEl.checked = step.value;
                            targetEl.dispatchEvent(new Event('change', { bubbles: true }));
                            playClickAnimation(targetEl);
                        }
                        setTimeout(executeNextStep, 600);
                    });
                } else {
                    setTimeout(executeNextStep, 100);
                }
                break;
            case 'select':
                if (targetEl) {
                    moveCursorToElement(targetEl, () => {
                        targetEl.value = step.value;
                        targetEl.dispatchEvent(new Event('change', { bubbles: true }));
                        playClickAnimation(targetEl);
                        setTimeout(executeNextStep, 600);
                    });
                } else {
                    setTimeout(executeNextStep, 100);
                }
                break;
            case 'wait':
                setTimeout(executeNextStep, step.duration);
                break;
            case 'action':
                step.run();
                setTimeout(executeNextStep, 200);
                break;
            default:
                setTimeout(executeNextStep, 100);
        }
    }

    // Load scenarios definitions
    function loadScenarioSteps(scenarioName) {
        const steps = [];
        
        if (scenarioName === 'scenario-non-ai') {
            steps.push(
                { type: 'thought', text: '使用者想要在不用 AI 的情況下，生成 3 個防封鎖訊息變體。開始自動操作。' },
                { type: 'tool_call', text: 'computer_use:move_to(target="#input-message")' },
                { type: 'move', target: '#input-message' },
                { type: 'tool_call', text: 'computer_use:type_text(target="#input-message", text="【限時快閃】大山咖啡買一送一！特惠網址：https://coffee.co/539，輸入代碼 COFFEE 享有折扣。")' },
                { type: 'type', target: '#input-message', text: '【限時快閃】大山咖啡買一送一！特惠網址：https://coffee.co/539，輸入代碼 COFFEE 享有折扣。' },
                
                { type: 'thought', text: '切換到「不用 AI 算法」分頁以啟用演算法混淆。' },
                { type: 'tool_call', text: 'computer_use:click(target="button[data-tab=tab-non-ai]")' },
                { type: 'click', target: 'button[data-tab=tab-non-ai]' },
                
                { type: 'thought', text: '調整生成變體數量為 3 個。' },
                { type: 'tool_call', text: 'computer_use:drag_slider(target="#variant-count", value=3)' },
                { type: 'slider', target: '#variant-count', value: 3 },
                
                { type: 'thought', text: '勾選「全/半形英文數字切換」與「秒級動態時間戳記與序號」。' },
                { type: 'tool_call', text: 'computer_use:check_checkbox(target="#opt-width", value=true)' },
                { type: 'checkbox', target: '#opt-width', value: true },
                { type: 'tool_call', text: 'computer_use:check_checkbox(target="#opt-timestamp", value=true)' },
                { type: 'checkbox', target: '#opt-timestamp', value: true },
                
                { type: 'thought', text: '點擊生成按鈕。' },
                { type: 'tool_call', text: 'computer_use:click(target="#btn-generate")' },
                { type: 'click', target: '#btn-generate' },
                
                { type: 'wait', duration: 1200 }, // Wait for algorithm to generate
                { type: 'result', text: '系統成功生成 3 個演算法變體（已包含零寬度混淆、英數全角化與帶有秒級時差的傳送時間戳）。' },
                
                { type: 'thought', text: '將生成的第一個變體複製到剪貼簿。' },
                { type: 'tool_call', text: 'computer_use:click(target=".btn-copy-variant[data-index=\'0\']")' },
                { type: 'click', target: () => document.querySelector('.btn-copy-variant[data-index="0"]') },
                { type: 'wait', duration: 800 },
                
                { type: 'thought', text: '演示完成！順利生成並複製不重複的訊息變體，且網址完全未受損。' }
            );
        } else if (scenarioName === 'scenario-ai-hybrid') {
            steps.push(
                { type: 'thought', text: '使用者希望使用 Gemini AI 重寫內容，並開啟混合模式進行雙重防封鎖。' },
                { type: 'tool_call', text: 'computer_use:move_to(target="#input-message")' },
                { type: 'move', target: '#input-message' },
                { type: 'tool_call', text: 'computer_use:type_text(target="#input-message", text="親愛的顧客您好，年終尾牙大回饋開始囉！全館滿千折百，請點連結登入：https://shop.co/sale")' },
                { type: 'type', target: '#input-message', text: '親愛的顧客您好，年終尾牙大回饋開始囉！全館滿千折百，請點連結登入：https://shop.co/sale' },
                
                { type: 'thought', text: '切換到「Gemini AI 改寫」分頁。' },
                { type: 'tool_call', text: 'computer_use:click(target="button[data-tab=tab-ai]")' },
                { type: 'click', target: 'button[data-tab=tab-ai]' },
                
                { type: 'thought', text: '輸入模擬的 Google Gemini API Key。' },
                { type: 'tool_call', text: 'computer_use:type_text(target="#api-key", text="AIzaSyDemoKey_SimulatedGeminiClient")' },
                { type: 'type', target: '#api-key', text: 'AIzaSyDemoKey_SimulatedGeminiClient' },
                
                { type: 'thought', text: '設定模型為 Gemini 2.5 Flash，風格設定為「親切日常」。' },
                { type: 'tool_call', text: 'computer_use:select_dropdown(target="#ai-model", value="gemini-2.5-flash")' },
                { type: 'select', target: '#ai-model', value: 'gemini-2.5-flash' },
                { type: 'tool_call', text: 'computer_use:select_dropdown(target="#ai-tone", value="casual")' },
                { type: 'select', target: '#ai-tone', value: 'casual' },
                
                { type: 'thought', text: '確認已啟用「AI 改寫 + 零寬度混合模式」。' },
                { type: 'tool_call', text: 'computer_use:check_checkbox(target="#opt-hybrid", value=true)' },
                { type: 'checkbox', target: '#opt-hybrid', value: true },
                
                { type: 'thought', text: '將生成個數設定為 2 個。' },
                { type: 'tool_call', text: 'computer_use:drag_slider(target="#variant-count", value=2)' },
                { type: 'slider', target: '#variant-count', value: 2 },
                
                { type: 'thought', text: '點擊生成按鈕。系統將呼叫模擬的 API 回應以加速演示。' },
                { type: 'tool_call', text: 'computer_use:click(target="#btn-generate")' },
                { type: 'click', target: '#btn-generate' },
                
                // Programmatically trigger a mock AI generation to avoid requiring a real key for the demo
                { type: 'action', run: () => simulateMockAIGenerator() },
                { type: 'wait', duration: 1800 }, // Wait for mock generation
                
                { type: 'thought', text: '生成完成。現在展示零寬度字元的隱形插入。開啟「顯示隱形字元」開關。' },
                { type: 'tool_call', text: 'computer_use:click(target="#toggle-zws-visibility")' },
                { type: 'click', target: 'label.toggle-switch' }, 
                { type: 'wait', duration: 800 },
                
                { type: 'thought', text: '看！亮紅色的虛線標示出零寬度控制符的插入位置，語意已重寫，防封鎖力滿分。' },
                { type: 'thought', text: '演示完成！成功模擬 AI 語意重寫與 ZWS 混合加密流程。' }
            );
        } else if (scenarioName === 'scenario-custom-noise') {
            steps.push(
                { type: 'thought', text: '使用者想要自訂前後干擾文字，並加上無關的雞湯名言。' },
                { type: 'tool_call', text: 'computer_use:move_to(target="#input-message")' },
                { type: 'move', target: '#input-message' },
                { type: 'tool_call', text: 'computer_use:type_text(target="#input-message", text="公告：明天上午 10:00 進行伺服器升級維護，期間可能會有斷線情況，請大家提早存檔。")' },
                { type: 'type', target: '#input-message', text: '公告：明天上午 10:00 進行伺服器升級維護，期間可能會有斷線情況，請大家提早存檔。' },
                
                { type: 'thought', text: '切換至「不用 AI 算法」Tab，並啟用問候語與無關語錄干擾。' },
                { type: 'tool_call', text: 'computer_use:click(target="button[data-tab=tab-non-ai]")' },
                { type: 'click', target: 'button[data-tab=tab-non-ai]' },
                { type: 'tool_call', text: 'computer_use:check_checkbox(target="#opt-noise-quote", value=true)' },
                { type: 'checkbox', target: '#opt-noise-quote', value: true },
                { type: 'tool_call', text: 'computer_use:check_checkbox(target="#opt-salutation", value=true)' },
                { type: 'checkbox', target: '#opt-salutation', value: true },
                
                { type: 'thought', text: '點擊展開「自訂無關文字與語錄庫」進階設定面板。' },
                { type: 'tool_call', text: 'computer_use:click(target="#btn-toggle-advanced")' },
                { type: 'click', target: '#btn-toggle-advanced' },
                
                { type: 'thought', text: '定位至「自訂無關雜訊句庫」輸入框，輸入自訂的干擾語錄。' },
                { type: 'tool_call', text: 'computer_use:move_to(target="#custom-quotes")' },
                { type: 'move', target: '#custom-quotes' },
                { type: 'tool_call', text: 'computer_use:type_text(target="#custom-quotes", text="（大家辛苦了，祝好運！）\\n（記得多喝水，放鬆心情。）\\n（抽獎純屬好玩，人人有機會！）")' },
                { type: 'type', target: '#custom-quotes', text: '（大家辛苦了，祝好運！）\n（記得多喝水，放鬆心情。）\n（抽獎純屬好玩，人人有機會！）' },
                
                { type: 'thought', text: '將生成個數調整為 4 個。' },
                { type: 'tool_call', text: 'computer_use:drag_slider(target="#variant-count", value=4)' },
                { type: 'slider', target: '#variant-count', value: 4 },
                
                { type: 'thought', text: '點擊開始批量生成變體。' },
                { type: 'tool_call', text: 'computer_use:click(target="#btn-generate")' },
                { type: 'click', target: '#btn-generate' },
                
                { type: 'wait', duration: 1200 },
                { type: 'result', text: '系統成功生成 4 個訊息變體，問候語、結尾祝福語與隨機雜訊句已隨機嵌入！' },
                
                { type: 'thought', text: '收合自訂面板。' },
                { type: 'tool_call', text: 'computer_use:click(target="#btn-toggle-advanced")' },
                { type: 'click', target: '#btn-toggle-advanced' },
                
                { type: 'thought', text: '演示完成！自訂雜訊文字池成功混淆前後文。' }
            );
        }
        
        return steps;
    }

    // Start Demo Simulation
    function startSimulation(scenario) {
        if (isSimulating) return;
        isSimulating = true;
        simPaused = false;
        currentStepIdx = 0;
        simSteps = loadScenarioSteps(scenario);
        
        btnStartSim.classList.add('hidden');
        btnPauseSim.classList.remove('hidden');
        btnPauseSim.innerHTML = '<i class="fa-solid fa-pause"></i> 暫停';
        btnStopSim.classList.remove('hidden');
        simHud.classList.remove('hidden');
        virtualCursor.classList.remove('hidden');
        simScenarioSelect.disabled = true;
        
        simHudBody.innerHTML = '';
        simHudStatus.textContent = '執行中...';
        simHudStatus.style.color = 'var(--success)';
        
        // Position virtual cursor initially at center screen
        virtualCursor.style.left = '50%';
        virtualCursor.style.top = '50%';
        
        setTimeout(executeNextStep, 500);
    }

    // Pause Demo Simulation
    function pauseSimulation() {
        if (!isSimulating) return;
        if (simPaused) {
            simPaused = false;
            btnPauseSim.innerHTML = '<i class="fa-solid fa-pause"></i> 暫停';
            simHudStatus.textContent = '執行中...';
            simHudStatus.style.color = 'var(--success)';
            executeNextStep();
        } else {
            simPaused = true;
            btnPauseSim.innerHTML = '<i class="fa-solid fa-play"></i> 繼續';
            simHudStatus.textContent = '已暫停';
            simHudStatus.style.color = 'var(--warning)';
        }
    }

    // Stop Demo Simulation
    function stopSimulation() {
        endSimulation(false);
    }

    // End Demo Simulation
    function endSimulation(completed = true) {
        isSimulating = false;
        simPaused = false;
        
        btnStartSim.classList.remove('hidden');
        btnPauseSim.classList.add('hidden');
        btnStopSim.classList.add('hidden');
        virtualCursor.classList.add('hidden');
        simScenarioSelect.disabled = false;
        
        if (completed) {
            simHudStatus.textContent = '完成';
            simHudStatus.style.color = 'var(--success)';
            appendSimLog('✅ 示範流程已全部順利執行完成！', 'sim-log-result');
        } else {
            simHudStatus.textContent = '已終止';
            simHudStatus.style.color = 'var(--danger)';
            appendSimLog('❌ 使用者已手動終止示範流程。', 'sim-log-thought');
        }
        
        // Clear all highlighted outline styles
        document.querySelectorAll('.sim-hover-target').forEach(el => el.classList.remove('sim-hover-target'));
    }

    // Bind Simulator Controller Buttons
    btnStartSim.addEventListener('click', () => {
        startSimulation(simScenarioSelect.value);
    });
    
    btnPauseSim.addEventListener('click', () => {
        pauseSimulation();
    });
    
    btnStopSim.addEventListener('click', () => {
        stopSimulation();
    });

    // Mock AI generator function for demo simulation
    function simulateMockAIGenerator() {
        const originalText = inputMessage.value.trim();
        const count = parseInt(variantCountSlider.value, 10);
        
        const mockTemplates = [
            "哈囉各位！跟大家報個超棒的消息 ✨\n期待已久的年終尾牙大回饋正式開跑啦！\n現在全館消費滿千折百，別錯過囉！\n趕緊點擊連結登入搶購：https://shop.co/sale",
            "✨ 專屬好康分享 ✨\n親愛的朋友，我們最熱門的年終尾牙大回饋活動已經開始囉！\n全館有滿千折百的好康，立刻去看看吧！\n點此連結登入活動網頁：https://shop.co/sale",
            "大家好，為您捎來年終的好消息 📢\n期待已久的尾牙大回饋今日啟動囉！\n只要滿千元即折百元，超划算！\n詳情請點連結登入專區：https://shop.co/sale",
            "【年終驚喜通知】🎉\n我們最受期待的尾牙大回饋活動開跑啦！\n全館消費滿千現折百元喔！\n趕快點擊這個連結登入參與：https://shop.co/sale"
        ];
        
        const quotes = customQuotes.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        generatedVariants = [];
        for (let i = 0; i < count; i++) {
            const template = mockTemplates[i % mockTemplates.length];
            
            // Apply Hybrid Mutations
            const hybridOptions = {
                zws: true,
                punctuation: true,
                emoji: false,
                salutation: false,
                synonyms: false,
                width: optWidth.checked,
                interleave: optInterleave.checked,
                noiseQuote: optNoiseQuote.checked,
                timestamp: optTimestamp.checked,
                prefixes: [],
                suffixes: [],
                quotes: quotes
            };
            
            const finalMutatedText = mutateTextNonAI(template, hybridOptions, i);
            
            generatedVariants.push({
                text: finalMutatedText,
                similarity: calculateSimilarity(originalText, finalMutatedText)
            });
        }
        
        // Render after simulated delay
        setTimeout(() => {
            if (!isSimulating) return;
            
            skeletonContainer.classList.add('hidden');
            emptyState.classList.add('hidden');
            resultsList.innerHTML = '';
            
            generatedVariants.forEach((variant, index) => {
                const card = document.createElement('div');
                card.className = 'variant-card';
                card.id = `variant-card-${index}`;
                
                const formattedBody = formatTextWithZws(variant.text);
                const variantHash = calculateHash(variant.text);
                let similarityClass = 'similarity-high';
                if (variant.similarity < 50) similarityClass = 'similarity-low';
                else if (variant.similarity < 85) similarityClass = 'similarity-mid';
                
                card.innerHTML = `
                    <div class="variant-meta">
                        <span class="variant-index">#${index + 1} 號變體</span>
                        <div class="variant-stats">
                            <div class="stat-item"><i class="fa-solid fa-calculator"></i> ${variant.text.length} 字</div>
                            <div class="stat-item ${similarityClass}"><i class="fa-solid fa-code-compare"></i> 相似度: ${variant.similarity}%</div>
                            <div class="stat-item text-purple-400 font-mono"><i class="fa-solid fa-hashtag"></i> Hash: ${variantHash}</div>
                        </div>
                    </div>
                    <div class="variant-body">${formattedBody}</div>
                    <div class="variant-footer">
                        <button class="btn btn-copy-variant" data-index="${index}"><i class="fa-regular fa-copy"></i> 複製內容</button>
                        <button class="btn btn-line-variant" data-index="${index}"><i class="fa-brands fa-line"></i> LINE 分送</button>
                    </div>
                `;
                resultsList.appendChild(card);
            });
            
            // Re-bind click listeners for generated variant cards
            document.querySelectorAll('.btn-copy-variant').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(btn.getAttribute('data-index'), 10);
                    copyToClipboard(generatedVariants[idx].text, idx);
                });
            });
            
            document.querySelectorAll('.btn-line-variant').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(btn.getAttribute('data-index'), 10);
                    shareToLine(generatedVariants[idx].text);
                });
            });
            
            resultsList.classList.remove('hidden');
            resultsCount.textContent = `共 ${generatedVariants.length} 個變體`;
            resultsCount.classList.remove('hidden');
            resultsActions.classList.remove('hidden');
            
            // Re-enable and reset normal generator button state
            btnGenerate.disabled = false;
            btnGenerate.querySelector('.btn-text').classList.remove('hidden');
            btnGenerate.querySelector('.spinner').classList.add('hidden');
        }, 1500);
    }
});

// Full-width character converter helper
function toFullWidth(char) {
    const code = char.charCodeAt(0);
    // A-Z, a-z, 0-9
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122) || (code >= 48 && code <= 57)) {
        return String.fromCharCode(code + 65248);
    }
    return char;
}

// Non-AI Text Mutator
function mutateTextNonAI(text, options, index) {
    // 1. Tokenize to separate URLs from text so we do NOT corrupt links
    const tokens = tokenizeText(text);
    
    // 2. Process text tokens
    const processedTokens = tokens.map(token => {
        if (token.type === 'url') {
            return token.value; // Keep URLs identical
        }
        return mutateTextToken(token.value, options, index);
    });

    let result = processedTokens.join('');

    // 3. Apply salutation and emoji (which applies globally or boundaries)
    result = applySalutationsAndEmojis(result, options);

    // 4. Apply random noise quotes
    if (options.noiseQuote && options.quotes && options.quotes.length > 0) {
        // Pick deterministically based on variant index
        const quoteIndex = (index) % options.quotes.length;
        const randomQuote = options.quotes[quoteIndex];
        result = result + '\n\n' + randomQuote;
    }

    // 5. Apply sequence offset timestamps and Unique Serial ID
    if (options.timestamp) {
        const now = new Date();
        // Offset seconds based on index (simulating staggered batch sends, e.g. 5s apart)
        const offsetSeconds = index * 5;
        now.setSeconds(now.getSeconds() + offsetSeconds);
        
        const pad = (num) => String(num).padStart(2, '0');
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        
        // Generate a stable unique 4-character hex ID based on variant index
        const seed = Math.sin(index + 3.14) * 10000;
        const hexVal = Math.floor((seed - Math.floor(seed)) * 0xffff);
        const hexId = hexVal.toString(16).toUpperCase().padStart(4, '0');
        
        const tsText = `【傳送時間: ${timeStr} | 序號: ${hexId}】`;
        result = result + '\n\n' + tsText;
    }

    return result;
}

// Tokenize helper to separate URLs
function tokenizeText(text) {
    const urlRegex = /(https?:\/\/[^\s\u200B-\u200D\uFEFF]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({
                type: 'text',
                value: text.substring(lastIndex, match.index)
            });
        }
        parts.push({
            type: 'url',
            value: match[0]
        });
        lastIndex = urlRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
        parts.push({
            type: 'text',
            value: text.substring(lastIndex)
        });
    }
    
    return parts;
}

// Mutate single text token
function mutateTextToken(tokenValue, options, index) {
    let result = tokenValue;
    
    // A. Synonym Replacement
    if (options.synonyms) {
        const words = Object.keys(synonyms);
        for (const word of words) {
            const regex = new RegExp(word, 'g');
            result = result.replace(regex, (match) => {
                // Determine based on index + character seed to keep variants diverse
                const seed = Math.sin(index + 1) * 10000;
                const randomVal = seed - Math.floor(seed);
                if (randomVal < 0.5) {
                    const list = synonyms[word];
                    // Pick synonyms based on deterministic index
                    const synonymIndex = Math.floor(randomVal * list.length);
                    return list[synonymIndex];
                }
                return match;
            });
        }
    }
    
    // B. Punctuation Mutations
    if (options.punctuation) {
        result = result.replace(/，/g, () => {
            const rand = Math.random();
            if (rand < 0.25) return ' ';
            if (rand < 0.45) return ' ~ ';
            if (rand < 0.65) return '、';
            if (rand < 0.8) return ', ';
            return '，';
        });
        result = result.replace(/。/g, () => {
            const rand = Math.random();
            if (rand < 0.3) return '！';
            if (rand < 0.5) return ' ~';
            if (rand < 0.75) return ' ';
            return '。';
        });
        result = result.replace(/！/g, () => {
            const rand = Math.random();
            if (rand < 0.4) return '～';
            if (rand < 0.7) return ' ';
            return '！';
        });
    }

    // C. Full-width Alphabet & Number conversion AND Homoglyph swapping
    if (options.width) {
        const charArray = Array.from(result);
        result = charArray.map((c, i) => {
            // Apply 45% probability of converting alphanumeric characters
            const seed = Math.sin(index + i) * 10000;
            const randomVal = seed - Math.floor(seed);
            if (randomVal < 0.45) {
                // Attempt homoglyph swapping first, fall back to full-width
                if (homoglyphMap[c]) {
                    return homoglyphMap[c];
                }
                return toFullWidth(c);
            }
            return c;
        }).join('');
    }

    // D. Interleaving dividers
    if (options.interleave) {
        const charArray = Array.from(result);
        const mutatedArray = [];
        for (let i = 0; i < charArray.length; i++) {
            mutatedArray.push(charArray[i]);
            const charCode = charArray[i].charCodeAt(0);
            const isChinese = charCode >= 0x4E00 && charCode <= 0x9FFF;
            // 20% probability of inserting a midpoint dot after Chinese character
            if (isChinese && i < charArray.length - 1 && Math.random() < 0.20) {
                mutatedArray.push('·');
            }
        }
        result = mutatedArray.join('');
    }
    
    // E. Zero-width character insertion
    if (options.zws) {
        const zwsChars = ['\u200B', '\u200C', '\u200D', '\uFEFF'];
        const charArray = Array.from(result);
        const mutatedArray = [];
        
        for (let i = 0; i < charArray.length; i++) {
            mutatedArray.push(charArray[i]);
            // Insert ZWS randomly with 30% probability, avoiding before punctuation or spaces
            const isPunctuation = /[\s，。！？、~·]/.test(charArray[i]);
            if (i < charArray.length - 1 && !isPunctuation && Math.random() < 0.3) {
                // Ensure variation across indices
                const seed = Math.sin(i + index) * 10000;
                const randomVal = seed - Math.floor(seed);
                const randomZws = zwsChars[Math.floor(randomVal * zwsChars.length)];
                mutatedArray.push(randomZws);
            }
        }
        result = mutatedArray.join('');
    }
    
    return result;
}

// Prepend greetings and append emoji
function applySalutationsAndEmojis(text, options) {
    let result = text;
    
    // Emojis appender
    if (options.emoji) {
        const emojis = ['🎉', '✨', '👍', '📢', '💡', '🔥', '📌', '👋', '👀', '⭐', '✅', '👏', '🎁', '🔔'];
        let paragraphs = result.split('\n');
        paragraphs = paragraphs.map(p => {
            if (p.trim().length > 0 && Math.random() < 0.45) {
                const randEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                return p + ' ' + randEmoji;
            }
            return p;
        });
        result = paragraphs.join('\n');
    }
    
    // Prefix Salutations from pool
    if (options.salutation && options.prefixes && options.prefixes.length > 0) {
        const randomSalutation = options.prefixes[Math.floor(Math.random() * options.prefixes.length)];
        result = randomSalutation + '\n' + result;
    }

    // Suffix blessings from pool
    if (options.salutation && options.suffixes && options.suffixes.length > 0) {
        const randomSuffix = options.suffixes[Math.floor(Math.random() * options.suffixes.length)];
        result = result + '\n\n' + randomSuffix;
    }
    
    return result;
}

// Fetch Gemini Rewrites in Batch
async function fetchGeminiRewrites(text, count, apiKey, model, tone) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const toneMap = {
        'professional': '專業商務語氣，詞句客氣、得體、正式且有禮貌。',
        'casual': '親切日常語氣，多用一些社群口語（如「喔、耶、哈囉、唷、啦」），適合社群群組轉發。',
        'promotional': '熱銷促銷語氣，強調限時限量、驚喜好康優惠，加強號召力與吸引力。',
        'concise': '極簡短版語氣，只保留精華核心，精簡冗詞贅字，句句重點。'
    };
    
    const prompt = `你是一個專業的社群推廣文案改寫助手。
請將下方【原始訊息】改寫成 ${count} 個截然不同的版本。

改寫原則：
1. 必須保留：核心資訊、網址（URL，例如 http 或 https 開頭的連結，網址字元必須一模一樣不可變更，不能漏掉）、聯絡資訊（如電話、LINE ID）、日期與時間、價格。
2. 風格要求：採用「${toneMap[tone]}」。
3. 多樣性：各版本之間的句子結構、主動被動、動詞用詞與句式要盡可能不同，避免被系統判定為相似內容。
4. 格式要求：請務必僅輸出一個標準 JSON 字串陣列，如 ["版本一內容", "版本二內容", ...]。
5. 嚴格遵守：請勿在輸出中包含任何 Markdown 語法（例如 \`\`\`json）、任何前後對話、或任何引導文字。只輸出 JSON 陣列本身。

【原始訊息】
${text}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.9, // Higher temp for more variety
                maxOutputTokens: 4096
            }
        })
    });
    
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || response.statusText || '未知錯誤';
        throw new Error(`API 請求失敗: ${errMsg}`);
    }
    
    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
        throw new Error('未收到有效的 AI 生成結果。');
    }
    
    // Clean and parse JSON
    let cleanedText = resultText.trim();
    if (cleanedText.startsWith('```')) {
        // Strip markdown code blocks if the model wrapped them
        cleanedText = cleanedText.replace(/^```(json)?/g, '').replace(/```$/g, '').trim();
    }
    
    try {
        const parsedArray = JSON.parse(cleanedText);
        if (Array.isArray(parsedArray)) {
            return parsedArray;
        } else {
            throw new Error('生成的結果不是陣列格式。');
        }
    } catch (e) {
        console.warn('JSON 解析失敗，嘗試行分割備用方案', e);
        // Fallback: split by lines or quotes
        const lines = cleanedText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.replace(/^[-*•\d.]\s*/, '').replace(/^["']|["']$/g, ''));
        
        if (lines.length >= count) {
            return lines.slice(0, count);
        }
        
        throw new Error(`無法解析 AI 生成的 JSON。AI 輸出內容：\n${resultText.substring(0, 300)}...`);
    }
}

// Levenshtein Distance
function getLevenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Similarity calculation
function calculateSimilarity(original, variant) {
    // Strip zero-width characters, timestamps/serials, noise quotes, interleaves, homoglyphs and emojis to measure semantic/visual similarity of basic text
    const zwsRegex = /[\u200B-\u200D\uFEFF]/g;
    const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|\u2600-\u27BF/g;
    const timestampRegex = /【傳送時間: \d{2}:\d{2}:\d{2} \| 序號: [0-9A-F]{4}】/g;
    const interleaveRegex = /·/g;
    
    let cleanOrig = original.replace(zwsRegex, '').replace(emojiRegex, '').replace(timestampRegex, '').replace(interleaveRegex, '').trim();
    let cleanVar = variant.replace(zwsRegex, '').replace(emojiRegex, '').replace(timestampRegex, '').replace(interleaveRegex, '').trim();
    
    // Map homoglyphs back to normal chars for a true semantic similarity comparison
    const homoglyphSwaps = Object.entries(homoglyphMap);
    homoglyphSwaps.forEach(([normal, swapped]) => {
        const regex = new RegExp(swapped, 'g');
        cleanOrig = cleanOrig.replace(regex, normal);
        cleanVar = cleanVar.replace(regex, normal);
    });
    
    if (cleanOrig === cleanVar) {
        return 100; // Text is visually identical (just coding/emoji/spacing/homoglyph differences)
    }
    
    const distance = getLevenshteinDistance(cleanOrig, cleanVar);
    const maxLength = Math.max(cleanOrig.length, cleanVar.length);
    
    if (maxLength === 0) return 100;
    
    return Math.round((1 - distance / maxLength) * 100);
}

// Safe homoglyphs segment wrap parser
function parseAndFormatHomoglyphs(html) {
    const parts = html.split(/(<[^>]*>)/g);
    const homoglyphValues = new Set(Object.values(homoglyphMap));
    
    const processed = parts.map(part => {
        if (part.startsWith('<') && part.endsWith('>')) {
            return part; // It's a tag definition, keep intact
        }
        
        let newPart = '';
        for (const char of part) {
            if (homoglyphValues.has(char)) {
                newPart += `<span class="homo-indicator" title="同形異碼字元變體">${char}</span>`;
            } else {
                newPart += char;
            }
        }
        return newPart;
    });
    
    return processed.join('');
}

// Highlight visual ZWS spaces, homoglyphs and interleaves
function formatTextWithZws(text) {
    let escaped = escapeHtml(text);
    
    escaped = escaped.replace(/\u200B/g, '<span class="zws-indicator" data-char="ZWS" title="Zero-Width Space"> ZWS </span>');
    escaped = escaped.replace(/\u200C/g, '<span class="zws-indicator" data-char="ZWNJ" title="Zero-Width Non-Joiner"> ZWNJ </span>');
    escaped = escaped.replace(/\u200D/g, '<span class="zws-indicator" data-char="ZWJ" title="Zero-Width Joiner"> ZWJ </span>');
    escaped = escaped.replace(/\uFEFF/g, '<span class="zws-indicator" data-char="BOM" title="Byte Order Mark"> BOM </span>');
    
    escaped = escaped.replace(/·/g, '<span class="inter-indicator" title="中文字交織點">·</span>');
    
    return parseAndFormatHomoglyphs(escaped);
}

// HTML escape helper
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
