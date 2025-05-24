class LocalizationManager {
    constructor() {
        // Embed locale data directly to avoid fetch issues in background script
        this.locales = {
            en: {
                summary: {
                    promptIntro: "Please provide a summary of the following webpage content",
                    lengthInstructions: {
                        short: "in 1-2 concise sentences",
                        medium: "in 3-4 clear sentences",
                        long: "in 1-2 detailed paragraphs"
                    },
                    labels: {
                        title: "Title",
                        url: "URL",
                        content: "Main Content",
                        headings: "Key Headings",
                        noTitle: "No title",
                        unknown: "Unknown",
                        noContent: "No content available"
                    },
                    instruction: "Focus on the main points and key information. Be concise and informative."
                },
                sentiment: {
                    instruction: "Analyze the sentiment and emotional tone of the following text. Categorize it as one of: joyful, neutral, or toxic.",
                    textLabel: "Text to analyze:",
                    formatInstruction: "Please respond in the following JSON format:",
                    categories: "joyful/neutral/toxic",
                    explanationLabel: "Brief explanation of why this sentiment was chosen",
                    detailInstruction: "Be thorough in your analysis, considering context, tone, and overall emotional impact.",
                    fallbackMessages: {
                        positive: "Positive sentiment detected",
                        negative: "Negative sentiment detected",
                        neutral: "No strong sentiment detected",
                        noExplanation: "No explanation provided"
                    },
                    categoryNames: {
                        joyful: "joyful",
                        neutral: "neutral",
                        toxic: "toxic"
                    }
                },
                test: {
                    prompt: "Respond with 'Connection successful!' to test the API.",
                    successMessage: "API connection successful!"
                }
            },
            es: {
                summary: {
                    promptIntro: "Por favor proporciona un resumen del siguiente contenido de página web",
                    lengthInstructions: {
                        short: "en 1-2 oraciones concisas",
                        medium: "en 3-4 oraciones claras",
                        long: "en 1-2 párrafos detallados"
                    },
                    labels: {
                        title: "Título",
                        url: "URL",
                        content: "Contenido Principal",
                        headings: "Encabezados Principales",
                        noTitle: "Sin título",
                        unknown: "Desconocido",
                        noContent: "Sin contenido disponible"
                    },
                    instruction: "Enfócate en los puntos principales e información clave. Sé conciso e informativo. Responde completamente en español."
                },
                sentiment: {
                    instruction: "Analiza el sentimiento y tono emocional del siguiente texto. Categorízalo como uno de: alegre, neutral, o tóxico.",
                    textLabel: "Texto a analizar:",
                    formatInstruction: "Por favor responde en el siguiente formato JSON:",
                    categories: "alegre/neutral/tóxico",
                    explanationLabel: "Breve explicación de por qué se eligió este sentimiento",
                    detailInstruction: "Sé minucioso en tu análisis, considerando contexto, tono e impacto emocional general. Responde completamente en español.",
                    fallbackMessages: {
                        positive: "Sentimiento positivo detectado",
                        negative: "Sentimiento negativo detectado",
                        neutral: "No se detectó sentimiento fuerte",
                        noExplanation: "Sin explicación proporcionada"
                    },
                    categoryNames: {
                        joyful: "alegre",
                        neutral: "neutral",
                        toxic: "tóxico"
                    }
                },
                test: {
                    prompt: "Responde con '¡Conexión exitosa!' para probar la API. Responde completamente en español.",
                    successMessage: "¡Conexión API exitosa!"
                }
            }
        };
        console.log('LocalizationManager: Initialized with embedded locales');
    }

    getLocale(language = 'en') {
        console.log('LocalizationManager: getLocale called for', language);
        
        if (this.locales[language]) {
            console.log('LocalizationManager: Found locale for', language);
            return this.locales[language];
        }
        
        console.log('LocalizationManager: Language not found, falling back to English');
        return this.locales.en;
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
                case 'contentScriptReady':
                    console.log('AIWebpageAnalyzerBackground: Content script ready on', request.url);
                    sendResponse({ success: true });
                    return true;
            }
        });
    }

    async analyzeWithAI({ content, analysisType, config }) {
        console.log('AIWebpageAnalyzerBackground: analyzeWithAI called', { analysisType, hasContent: !!content, hasConfig: !!config });
        
        try {
            const { provider, model, apiKey } = config;
            
            if (!provider || !model || !apiKey) {
                console.log('AIWebpageAnalyzerBackground: Missing AI configuration');
                throw new Error('Missing AI configuration');
            }

            console.log('AIWebpageAnalyzerBackground: Getting language settings...');
            // Get language preference
            const settings = await this.getSettings();
            const language = settings.responseLanguage || 'en';
            console.log('AIWebpageAnalyzerBackground: Language preference:', language);

            let result;
            switch (analysisType) {
                case 'summary':
                    console.log('AIWebpageAnalyzerBackground: Generating summary...');
                    result = await this.generateSummary(content, config, language);
                    break;
                case 'sentiment':
                    console.log('AIWebpageAnalyzerBackground: Analyzing sentiment...');
                    result = await this.analyzeSentiment(content, config, language);
                    break;
                default:
                    console.log('AIWebpageAnalyzerBackground: Unknown analysis type:', analysisType);
                    throw new Error('Unknown analysis type');
            }

            console.log('AIWebpageAnalyzerBackground: Analysis completed successfully');
            return { success: true, result };
        } catch (error) {
            console.error('AIWebpageAnalyzerBackground: Error in analyzeWithAI:', error);
            return { success: false, error: error.message };
        }
    }

    async generateSummary(content, config, language) {
        const prompt = this.createSummaryPrompt(content, config.summaryLength, language);
        const response = await this.callAI(prompt, config);
        return {
            type: 'summary',
            content: response,
            wordCount: content.text?.split(' ').length || 0
        };
    }

    async analyzeSentiment(content, config, language) {
        const prompt = this.createSentimentPrompt(content.text, language);
        const response = await this.callAI(prompt, config);
        
        const sentiment = this.parseSentimentResponse(response, language);
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

    createSummaryPrompt(content, length = 'medium', language = 'en') {
        const locale = this.localizationManager.getLocale(language);
        const summary = locale.summary;

        return `${summary.promptIntro} ${summary.lengthInstructions[length]}:

${summary.labels.title}: ${content.title || summary.labels.noTitle}
${summary.labels.url}: ${content.url || summary.labels.unknown}

${summary.labels.content}:
${content.text || summary.labels.noContent}

${content.headings?.length ? `\n${summary.labels.headings}: ${content.headings.map(h => h.text).join(', ')}` : ''}

${summary.instruction}`;
    }

    createSentimentPrompt(text, language = 'en') {
        const locale = this.localizationManager.getLocale(language);
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
            const locale = this.localizationManager.getLocale(language);
            
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

    parseSentimentResponse(response, language = 'en') {
        const locale = this.localizationManager.getLocale(language);
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