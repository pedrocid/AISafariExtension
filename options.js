class OptionsManager {
    constructor() {
        this.models = {
            openai: [
                { value: 'gpt-4', label: 'GPT-4 (Most capable)' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Faster)' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Cost-effective)' }
            ],
            anthropic: [
                { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most capable)' },
                { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Balanced)' },
                { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fastest)' }
            ]
        };

        this.apiInstructions = {
            openai: [
                'Go to <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI API Keys</a>',
                'Click "Create new secret key"',
                'Copy the generated key and paste it above',
                'Note: You need billing setup to use the API'
            ],
            anthropic: [
                'Visit <a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a>',
                'Go to Settings → API Keys',
                'Click "Create Key"',
                'Copy the key and paste it above'
            ]
        };

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
    }

    setupEventListeners() {
        document.getElementById('aiProvider').addEventListener('change', (e) => {
            this.handleProviderChange(e.target.value);
        });

        document.getElementById('toggleApiKey').addEventListener('click', () => {
            this.toggleApiKeyVisibility();
        });

        document.getElementById('apiKey').addEventListener('input', () => {
            this.updateTestButtonState();
        });

        document.getElementById('testConnection').addEventListener('click', () => {
            this.testConnection();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('resetSettings').addEventListener('click', () => {
            this.resetSettings();
        });
    }

    async loadSettings() {
        const settings = await this.getStoredSettings();
        
        if (settings.aiProvider) {
            document.getElementById('aiProvider').value = settings.aiProvider;
            this.handleProviderChange(settings.aiProvider);
            
            if (settings.aiModel) {
                document.getElementById('modelName').value = settings.aiModel;
            }
        }

        if (settings.apiKey) {
            document.getElementById('apiKey').value = settings.apiKey;
        }

        if (settings.summaryLength) {
            document.getElementById('summaryLength').value = settings.summaryLength;
        }

        if (settings.maxImages) {
            document.getElementById('maxImages').value = settings.maxImages;
        }

        this.updateTestButtonState();
    }

    getStoredSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get([
                'aiProvider', 
                'aiModel', 
                'apiKey', 
                'summaryLength', 
                'maxImages'
            ], resolve);
        });
    }

    handleProviderChange(provider) {
        const modelOptions = document.getElementById('modelOptions');
        const modelSelect = document.getElementById('modelName');
        const apiKeyHelp = document.getElementById('apiKeyHelp');
        const apiKeyInstructions = document.getElementById('apiKeyInstructions');

        if (provider && this.models[provider]) {
            modelOptions.classList.remove('hidden');
            
            modelSelect.innerHTML = '';
            this.models[provider].forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.label;
                modelSelect.appendChild(option);
            });

            apiKeyHelp.classList.remove('hidden');
            apiKeyInstructions.innerHTML = this.apiInstructions[provider]
                .map(instruction => `<li>${instruction}</li>`)
                .join('');
        } else {
            modelOptions.classList.add('hidden');
            apiKeyHelp.classList.add('hidden');
        }

        this.updateTestButtonState();
    }

    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('apiKey');
        const toggleBtn = document.getElementById('toggleApiKey');
        
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            apiKeyInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    }

    updateTestButtonState() {
        const provider = document.getElementById('aiProvider').value;
        const apiKey = document.getElementById('apiKey').value;
        const testBtn = document.getElementById('testConnection');
        
        testBtn.disabled = !provider || !apiKey;
    }

    async testConnection() {
        const testBtn = document.getElementById('testConnection');
        const testResult = document.getElementById('testResult');
        
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        testResult.className = 'test-result';
        testResult.textContent = 'Testing API connection...';

        try {
            const config = this.getCurrentConfig();
            const result = await this.sendTestRequest(config);
            
            if (result.success) {
                testResult.className = 'test-result success';
                testResult.textContent = '✅ Connection successful!';
            } else {
                testResult.className = 'test-result error';
                testResult.textContent = `❌ ${result.error}`;
            }
        } catch (error) {
            testResult.className = 'test-result error';
            testResult.textContent = `❌ ${error.message}`;
        }

        testBtn.disabled = false;
        testBtn.textContent = 'Test Connection';
        testResult.classList.remove('hidden');
    }

    getCurrentConfig() {
        return {
            provider: document.getElementById('aiProvider').value,
            model: document.getElementById('modelName').value,
            apiKey: document.getElementById('apiKey').value
        };
    }

    sendTestRequest(config) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'testAPIConnection',
                config: config
            }, resolve);
        });
    }

    async saveSettings() {
        const saveBtn = document.getElementById('saveSettings');
        const saveStatus = document.getElementById('saveStatus');
        
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const settings = {
                aiProvider: document.getElementById('aiProvider').value,
                aiModel: document.getElementById('modelName').value,
                apiKey: document.getElementById('apiKey').value,
                summaryLength: document.getElementById('summaryLength').value,
                maxImages: document.getElementById('maxImages').value
            };

            await this.storeSettings(settings);
            
            saveStatus.className = 'save-status success';
            saveStatus.textContent = '✅ Settings saved successfully!';
            
        } catch (error) {
            saveStatus.className = 'save-status error';
            saveStatus.textContent = `❌ Error saving settings: ${error.message}`;
        }

        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Settings';
        saveStatus.classList.remove('hidden');
        
        setTimeout(() => {
            saveStatus.classList.add('hidden');
        }, 3000);
    }

    storeSettings(settings) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(settings, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    }

    async resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults? This will clear your API key.')) {
            try {
                await new Promise((resolve, reject) => {
                    chrome.storage.sync.clear(() => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                });

                document.getElementById('aiProvider').value = '';
                document.getElementById('apiKey').value = '';
                document.getElementById('summaryLength').value = 'medium';
                document.getElementById('maxImages').value = '20';
                
                this.handleProviderChange('');
                
                const saveStatus = document.getElementById('saveStatus');
                saveStatus.className = 'save-status success';
                saveStatus.textContent = '✅ Settings reset to defaults!';
                saveStatus.classList.remove('hidden');
                
                setTimeout(() => {
                    saveStatus.classList.add('hidden');
                }, 3000);
                
            } catch (error) {
                alert('Error resetting settings: ' + error.message);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});