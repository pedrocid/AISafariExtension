class LocalizationManager {
    constructor() {
        this.locales = {};
        this.loadedLanguages = new Set();
    }

    async loadLocale(language) {
        if (this.loadedLanguages.has(language)) {
            return this.locales[language];
        }

        try {
            const response = await fetch(chrome.runtime.getURL(`locales/${language}.json`));
            if (!response.ok) {
                throw new Error(`Failed to load locale: ${language}`);
            }
            const localeData = await response.json();
            this.locales[language] = localeData;
            this.loadedLanguages.add(language);
            return localeData;
        } catch (error) {
            console.warn(`Failed to load locale ${language}, falling back to English:`, error);
            if (language !== 'en') {
                return await this.loadLocale('en');
            }
            throw error;
        }
    }

    async getLocale(language = 'en') {
        return await this.loadLocale(language);
    }
}

class AIWebpageAnalyzerBackground {
    constructor() {
        this.localizationManager = new LocalizationManager();
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'analyzeWithAI':
                    this.analyzeWithAI(request.data).then(sendResponse);
                    return true;
                case 'testAPIConnection':
                    this.testAPIConnection(request.config).then(sendResponse);
                    return true;
            }
        });
    }

    async analyzeWithAI({ content, analysisType, config }) {
        try {
            const { provider, model, apiKey } = config;
            
            if (!provider || !model || !apiKey) {
                throw new Error('Missing AI configuration');
            }

            // Get language preference
            const settings = await this.getSettings();
            const language = settings.responseLanguage || 'en';

            let result;
            switch (analysisType) {
                case 'summary':
                    result = await this.generateSummary(content, config, language);
                    break;
                case 'sentiment':
                    result = await this.analyzeSentiment(content, config, language);
                    break;
                default:
                    throw new Error('Unknown analysis type');
            }

            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async generateSummary(content, config, language) {
        const prompt = await this.createSummaryPrompt(content, config.summaryLength, language);
        const response = await this.callAI(prompt, config);
        return {
            type: 'summary',
            content: response,
            wordCount: content.text?.split(' ').length || 0
        };
    }

    async analyzeSentiment(content, config, language) {
        const prompt = await this.createSentimentPrompt(content.text, language);
        const response = await this.callAI(prompt, config);
        
        const sentiment = await this.parseSentimentResponse(response, language);
        return {
            type: 'sentiment',
            sentiment: sentiment.category,
            confidence: sentiment.confidence,
            explanation: sentiment.explanation,
            wordCount: content.wordCount || 0
        };
    }

    getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get([
                'responseLanguage'
            ], resolve);
        });
    }

    async createSummaryPrompt(content, length = 'medium', language = 'en') {
        const locale = await this.localizationManager.getLocale(language);
        const summary = locale.summary;

        return `${summary.promptIntro} ${summary.lengthInstructions[length]}:

${summary.labels.title}: ${content.title || summary.labels.noTitle}
${summary.labels.url}: ${content.url || summary.labels.unknown}

${summary.labels.content}:
${content.text || summary.labels.noContent}

${content.headings?.length ? `\n${summary.labels.headings}: ${content.headings.map(h => h.text).join(', ')}` : ''}

${summary.instruction}`;
    }

    async createSentimentPrompt(text, language = 'en') {
        const locale = await this.localizationManager.getLocale(language);
        const sentiment = locale.sentiment;

        return `${sentiment.instruction}

${sentiment.textLabel}
${text}

${sentiment.formatInstruction}
{
  "category": "${sentiment.categories}",
  "confidence": 0.85,
  "explanation": "${sentiment.explanationLabel}"
}

${sentiment.detailInstruction}`;
    }

    async callAI(prompt, config) {
        const { provider, model, apiKey } = config;

        if (provider === 'openai') {
            return await this.callOpenAI(prompt, model, apiKey);
        } else if (provider === 'anthropic') {
            return await this.callAnthropic(prompt, model, apiKey);
        } else {
            throw new Error('Unsupported AI provider');
        }
    }

    async callOpenAI(prompt, model, apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callAnthropic(prompt, model, apiKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 500,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async testAPIConnection(config) {
        try {
            const settings = await this.getSettings();
            const language = settings.responseLanguage || 'en';
            const locale = await this.localizationManager.getLocale(language);
            
            const testPrompt = locale.test.prompt;
            const response = await this.callAI(testPrompt, config);
            
            return { 
                success: true, 
                message: locale.test.successMessage,
                response: response.substring(0, 100)
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    async parseSentimentResponse(response, language = 'en') {
        const locale = await this.localizationManager.getLocale(language);
        const sentiment = locale.sentiment;
        
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    category: parsed.category || 'neutral',
                    confidence: parsed.confidence || 0.5,
                    explanation: parsed.explanation || sentiment.fallbackMessages.noExplanation
                };
            }
        } catch (e) {
            console.warn('Failed to parse sentiment JSON, using fallback');
        }

        const lowerResponse = response.toLowerCase();
        
        // Check for positive sentiment
        if (lowerResponse.includes('alegre') || lowerResponse.includes('joyful') || 
            lowerResponse.includes('positive') || lowerResponse.includes('happy') || 
            lowerResponse.includes('positivo')) {
            return { 
                category: sentiment.categoryNames.joyful, 
                confidence: 0.7, 
                explanation: sentiment.fallbackMessages.positive 
            };
        } 
        // Check for negative sentiment
        else if (lowerResponse.includes('tóxico') || lowerResponse.includes('toxic') || 
                 lowerResponse.includes('negative') || lowerResponse.includes('hostile') || 
                 lowerResponse.includes('negativo')) {
            return { 
                category: sentiment.categoryNames.toxic, 
                confidence: 0.7, 
                explanation: sentiment.fallbackMessages.negative 
            };
        } 
        // Default to neutral
        else {
            return { 
                category: sentiment.categoryNames.neutral, 
                confidence: 0.6, 
                explanation: sentiment.fallbackMessages.neutral 
            };
        }
    }
}

new AIWebpageAnalyzerBackground();