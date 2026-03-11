const { AiSetting } = require('../models');

function getProviderName(provider) {
    const map = {
        gemini: 'Google Gemini',
        openai: 'OpenAI',
        groq: 'Groq (Fast)',
        qwen: 'Qwen (Alibaba)',
    };
    return map[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

// Get active AI settings (public)
exports.getSettings = async (req, res) => {
    try {
        const setting = await AiSetting.findOne({ where: { is_active: true } });
        if (!setting) {
            return res.json({});
        }
        res.json({
            id: setting.id,
            provider: getProviderName(setting.provider),
            model: setting.selected_model,
        });
    } catch (error) {
        console.error('AI settings error:', error);
        res.json({});
    }
};

// Chat with AI
exports.chat = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Silakan login terlebih dahulu' });
    }

    const { setting_id, model, message, history } = req.body;

    if (!setting_id || !model || !message) {
        return res.status(400).json({ error: 'Setting ID, model, dan pesan wajib diisi' });
    }

    try {
        const setting = await AiSetting.findByPk(setting_id);
        if (!setting || !setting.is_active) {
            return res.status(403).json({ error: 'Model ini sedang tidak aktif.' });
        }

        const messages = [...(history || []), { role: 'user', content: message }];
        let systemPrompt = setting.system_prompt || '';
        if (setting.reference_url) {
            systemPrompt += '\n\nGunakan website berikut sebagai referensi instruksi tambahan: ' + setting.reference_url;
        }

        let response;
        if (setting.provider === 'gemini') {
            response = await chatGemini(setting.api_key, setting.selected_model || model, messages, systemPrompt);
        } else {
            response = await chatOpenAiCompatible(setting.provider, setting.api_key, setting.selected_model || model, messages, systemPrompt);
        }

        res.json({ response });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'Gagal memproses chat AI: ' + error.message });
    }
};

// Gemini chat
async function chatGemini(apiKey, model, messages, systemPrompt) {
    const contents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));

    const payload = { contents };
    if (systemPrompt) {
        payload.system_instruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
    }

    const error = await response.json();
    return `Gemini Error: ${error.error?.message || JSON.stringify(error)}`;
}

// OpenAI-compatible chat (OpenAI, Groq, Qwen)
async function chatOpenAiCompatible(provider, apiKey, model, messages, systemPrompt) {
    const baseUrls = {
        openai: 'https://api.openai.com/v1',
        groq: 'https://api.groq.com/openai/v1',
        qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    };
    const baseUrl = baseUrls[provider] || baseUrls.openai;

    const finalMessages = [...messages];
    if (systemPrompt) {
        finalMessages.unshift({ role: 'system', content: systemPrompt });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages: finalMessages }),
    });

    if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'No response.';
    }

    const error = await response.json();
    return `${provider} Error: ${error.error?.message || JSON.stringify(error)}`;
}
