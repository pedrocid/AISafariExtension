class PopupManager {
    constructor() {
        this.currentImages = [];
        this.currentImageIndex = 0;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkConfiguration();
    }

    setupEventListeners() {
        document.getElementById('summaryBtn').addEventListener('click', () => {
            this.handleAnalysis('summary');
        });

        document.getElementById('galleryBtn').addEventListener('click', () => {
            this.handleImageGallery();
        });

        document.getElementById('sentimentBtn').addEventListener('click', () => {
            this.handleAnalysis('sentiment');
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
        });

        document.getElementById('openSettings').addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
        });

        document.getElementById('closeResult').addEventListener('click', () => {
            this.hideResults();
        });
    }

    async checkConfiguration() {
        const config = await this.getStoredConfig();
        const configNotice = document.getElementById('configNotice');
        const analysisOptions = document.querySelector('.analysis-options');

        if (!config.provider || !config.apiKey) {
            configNotice.classList.remove('hidden');
            analysisOptions.style.opacity = '0.5';
            analysisOptions.style.pointerEvents = 'none';
        } else {
            configNotice.classList.add('hidden');
            analysisOptions.style.opacity = '1';
            analysisOptions.style.pointerEvents = 'auto';
        }
    }

    async getStoredConfig() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['aiProvider', 'aiModel', 'apiKey', 'summaryLength'], (result) => {
                resolve({
                    provider: result.aiProvider,
                    model: result.aiModel,
                    apiKey: result.apiKey,
                    summaryLength: result.summaryLength || 'medium'
                });
            });
        });
    }

    async handleAnalysis(type) {
        this.showLoading();

        try {
            const config = await this.getStoredConfig();
            
            if (!config.provider || !config.apiKey) {
                throw new Error('Please configure your AI settings first');
            }

            const content = await this.extractPageContent(type);
            
            if (!content.success) {
                throw new Error(content.error);
            }

            const result = await this.analyzeWithAI(content.content || content, type, config);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            this.displayResults(type, result.result);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleImageGallery() {
        this.showLoading('Loading images...');

        try {
            const result = await this.extractImages();
            
            if (!result.success) {
                throw new Error(result.error);
            }

            this.currentImages = result.images;
            this.displayImageGallery();
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    extractPageContent(type) {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const action = type === 'sentiment' ? 'extractTextForSentiment' : 'extractPageContent';
                chrome.tabs.sendMessage(tabs[0].id, { action }, resolve);
            });
        });
    }

    extractImages() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'extractImages' }, resolve);
            });
        });
    }

    analyzeWithAI(content, analysisType, config) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'analyzeWithAI',
                data: { content, analysisType, config }
            }, resolve);
        });
    }

    showLoading(message = 'Analyzing with AI...') {
        const resultContainer = document.getElementById('resultContainer');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const resultContent = document.getElementById('resultContent');
        
        resultContainer.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');
        resultContent.classList.add('hidden');
        
        loadingSpinner.querySelector('p').textContent = message;
        document.getElementById('resultTitle').textContent = 'Processing...';
    }

    hideLoading() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const resultContent = document.getElementById('resultContent');
        
        loadingSpinner.classList.add('hidden');
        resultContent.classList.remove('hidden');
    }

    hideResults() {
        document.getElementById('resultContainer').classList.add('hidden');
    }

    displayResults(type, result) {
        this.hideLoading();
        
        const resultTitle = document.getElementById('resultTitle');
        const resultContent = document.getElementById('resultContent');

        switch (type) {
            case 'summary':
                resultTitle.textContent = 'Page Summary';
                resultContent.innerHTML = `
                    <div class="summary-result">
                        <p class="summary-text">${result.content}</p>
                        <div class="summary-meta">
                            <small>Source: ${result.wordCount} words analyzed</small>
                        </div>
                    </div>
                `;
                break;

            case 'sentiment':
                resultTitle.textContent = 'Sentiment Analysis';
                const sentimentIcon = this.getSentimentIcon(result.sentiment);
                const confidencePercent = Math.round(result.confidence * 100);
                
                resultContent.innerHTML = `
                    <div class="sentiment-result">
                        <div class="sentiment-main">
                            <span class="sentiment-icon">${sentimentIcon}</span>
                            <div class="sentiment-info">
                                <h3 class="sentiment-category">${result.sentiment.toUpperCase()}</h3>
                                <div class="confidence-bar">
                                    <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
                                </div>
                                <small class="confidence-text">${confidencePercent}% confidence</small>
                            </div>
                        </div>
                        <p class="sentiment-explanation">${result.explanation}</p>
                        <div class="sentiment-meta">
                            <small>Analyzed ${result.wordCount} words</small>
                        </div>
                    </div>
                `;
                break;
        }
    }

    displayImageGallery() {
        this.hideLoading();
        
        const resultTitle = document.getElementById('resultTitle');
        const resultContent = document.getElementById('resultContent');

        resultTitle.textContent = `Image Gallery (${this.currentImages.length} images)`;

        if (this.currentImages.length === 0) {
            resultContent.innerHTML = `
                <div class="no-images">
                    <p>No images found on this page.</p>
                </div>
            `;
            return;
        }

        resultContent.innerHTML = `
            <div class="image-gallery">
                <div class="image-viewer">
                    <img id="currentImage" src="${this.currentImages[0].src}" alt="${this.currentImages[0].alt}">
                    <div class="image-info">
                        <p class="image-title">${this.currentImages[0].alt || this.currentImages[0].title || 'Untitled'}</p>
                        <small class="image-meta">${this.currentImages[0].width} × ${this.currentImages[0].height}</small>
                    </div>
                </div>
                <div class="image-controls">
                    <button id="prevImage" class="nav-btn">‹</button>
                    <span class="image-counter">1 / ${this.currentImages.length}</span>
                    <button id="nextImage" class="nav-btn">›</button>
                </div>
                <div class="image-thumbnails">
                    ${this.currentImages.slice(0, 10).map((img, index) => `
                        <img src="${img.src}" alt="" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                    `).join('')}
                    ${this.currentImages.length > 10 ? `<div class="more-images">+${this.currentImages.length - 10}</div>` : ''}
                </div>
            </div>
        `;

        this.setupImageGalleryEvents();
    }

    setupImageGalleryEvents() {
        document.getElementById('prevImage').addEventListener('click', () => {
            this.navigateImage(-1);
        });

        document.getElementById('nextImage').addEventListener('click', () => {
            this.navigateImage(1);
        });

        document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                this.showImage(index);
            });
        });
    }

    navigateImage(direction) {
        this.currentImageIndex += direction;
        
        if (this.currentImageIndex < 0) {
            this.currentImageIndex = this.currentImages.length - 1;
        } else if (this.currentImageIndex >= this.currentImages.length) {
            this.currentImageIndex = 0;
        }
        
        this.showImage(this.currentImageIndex);
    }

    showImage(index) {
        this.currentImageIndex = index;
        const image = this.currentImages[index];
        
        document.getElementById('currentImage').src = image.src;
        document.querySelector('.image-title').textContent = image.alt || image.title || 'Untitled';
        document.querySelector('.image-meta').textContent = `${image.width} × ${image.height}`;
        document.querySelector('.image-counter').textContent = `${index + 1} / ${this.currentImages.length}`;
        
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    getSentimentIcon(sentiment) {
        switch (sentiment.toLowerCase()) {
            case 'joyful': return '😊';
            case 'toxic': return '😠';
            case 'neutral':
            default: return '😐';
        }
    }

    showError(message) {
        this.hideLoading();
        
        const resultTitle = document.getElementById('resultTitle');
        const resultContent = document.getElementById('resultContent');
        
        resultTitle.textContent = 'Error';
        resultContent.innerHTML = `
            <div class="error-message">
                <p>❌ ${message}</p>
                <button onclick="window.close()" class="retry-btn">Close</button>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});