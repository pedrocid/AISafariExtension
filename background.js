class AIWebpageAnalyzerBackground {
    constructor() {
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

            let result;
            switch (analysisType) {
                case 'summary':
                    result = await this.generateSummary(content, config);
                    break;
                case 'sentiment':
                    result = await this.analyzeSentiment(content, config);
                    break;
                default:
                    throw new Error('Unknown analysis type');
            }

            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async generateSummary(content, config) {
        const prompt = this.createSummaryPrompt(content, config.summaryLength);
        const response = await this.callAI(prompt, config);
        return {
            type: 'summary',
            content: response,
            wordCount: content.text?.split(' ').length || 0
        };
    }

    async analyzeSentiment(content, config) {
        const prompt = this.createSentimentPrompt(content.text);
        const response = await this.callAI(prompt, config);
        
        const sentiment = this.parseSentimentResponse(response);
        return {
            type: 'sentiment',
            sentiment: sentiment.category,
            confidence: sentiment.confidence,
            explanation: sentiment.explanation,
            wordCount: content.wordCount || 0
        };
    }

    createSummaryPrompt(content, length = 'medium') {
        const lengthInstructions = {
            'short': 'in 1-2 concise sentences',
            'medium': 'in 3-4 clear sentences',
            'long': 'in 1-2 detailed paragraphs'
        };

        return `Please provide a summary of the following webpage content ${lengthInstructions[length]}:

Title: ${content.title || 'No title'}
URL: ${content.url || 'Unknown'}

Main Content:
${content.text || 'No content available'}

${content.headings?.length ? `\nKey Headings: ${content.headings.map(h => h.text).join(', ')}` : ''}

Focus on the main points and key information. Be concise and informative.`;
    }

    createSentimentPrompt(text) {
        return `Analyze the sentiment and emotional tone of the following text. Categorize it as one of: joyful, neutral, or toxic.

Text to analyze:
${text}

Please respond in the following JSON format:
{
  "category": "joyful/neutral/toxic",
  "confidence": 0.85,
  "explanation": "Brief explanation of why this sentiment was chosen"
}

Be thorough in your analysis, considering context, tone, and overall emotional impact.`;
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
            const testPrompt = "Respond with 'Connection successful!' to test the API.";
            const response = await this.callAI(testPrompt, config);
            return { 
                success: true, 
                message: 'API connection successful!',
                response: response.substring(0, 100)
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    parseSentimentResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    category: parsed.category || 'neutral',
                    confidence: parsed.confidence || 0.5,
                    explanation: parsed.explanation || 'No explanation provided'
                };
            }
        } catch (e) {
            console.warn('Failed to parse sentiment JSON, using fallback');
        }

        const lowerResponse = response.toLowerCase();
        if (lowerResponse.includes('joyful') || lowerResponse.includes('positive') || lowerResponse.includes('happy')) {
            return { category: 'joyful', confidence: 0.7, explanation: 'Detected positive sentiment' };
        } else if (lowerResponse.includes('toxic') || lowerResponse.includes('negative') || lowerResponse.includes('hostile')) {
            return { category: 'toxic', confidence: 0.7, explanation: 'Detected negative sentiment' };
        } else {
            return { category: 'neutral', confidence: 0.6, explanation: 'No strong sentiment detected' };
        }
    }
}

new AIWebpageAnalyzerBackground();