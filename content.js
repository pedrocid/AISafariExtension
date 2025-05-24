class WebpageAnalyzer {
    constructor() {
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'extractPageContent':
                    this.extractPageContent().then(sendResponse);
                    return true;
                case 'extractImages':
                    this.extractImages().then(sendResponse);
                    return true;
                case 'extractTextForSentiment':
                    this.extractTextForSentiment().then(sendResponse);
                    return true;
            }
        });
    }

    async extractPageContent() {
        try {
            const content = {
                title: document.title,
                url: window.location.href,
                text: this.getMainTextContent(),
                headings: this.getHeadings(),
                metadata: this.getMetadata()
            };
            return { success: true, content };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async extractImages() {
        try {
            const images = [];
            const imgElements = document.querySelectorAll('img');
            
            imgElements.forEach((img, index) => {
                if (this.isValidImage(img)) {
                    images.push({
                        src: img.src,
                        alt: img.alt || '',
                        title: img.title || '',
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height,
                        index: index
                    });
                }
            });

            const backgroundImages = this.extractBackgroundImages();
            images.push(...backgroundImages);

            return { success: true, images: images.slice(0, 100) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async extractTextForSentiment() {
        try {
            const textElements = [
                ...document.querySelectorAll('p'),
                ...document.querySelectorAll('h1, h2, h3, h4, h5, h6'),
                ...document.querySelectorAll('article'),
                ...document.querySelectorAll('[role="main"]'),
                ...document.querySelectorAll('.content, .post, .article')
            ];

            let combinedText = '';
            textElements.forEach(element => {
                const text = element.innerText?.trim();
                if (text && text.length > 10) {
                    combinedText += text + ' ';
                }
            });

            if (!combinedText.trim()) {
                combinedText = document.body.innerText || '';
            }

            const cleanText = combinedText
                .replace(/\s+/g, ' ')
                .replace(/[^\w\s.,!?;:"'-]/g, '')
                .trim()
                .substring(0, 5000);

            return { 
                success: true, 
                text: cleanText,
                wordCount: cleanText.split(' ').length
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getMainTextContent() {
        const contentSelectors = [
            'article',
            '[role="main"]',
            '.content',
            '.post-content',
            '.entry-content',
            '.article-content',
            'main',
            '#content',
            '.main-content'
        ];

        for (const selector of contentSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                return this.cleanText(element.innerText);
            }
        }

        const paragraphs = Array.from(document.querySelectorAll('p'))
            .map(p => p.innerText?.trim())
            .filter(text => text && text.length > 20)
            .join(' ');

        return this.cleanText(paragraphs || document.body.innerText);
    }

    getHeadings() {
        const headings = [];
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
            const text = heading.innerText?.trim();
            if (text) {
                headings.push({
                    level: parseInt(heading.tagName.substring(1)),
                    text: text
                });
            }
        });
        return headings;
    }

    getMetadata() {
        const metadata = {};
        
        const metaTags = document.querySelectorAll('meta[name], meta[property]');
        metaTags.forEach(meta => {
            const key = meta.getAttribute('name') || meta.getAttribute('property');
            const content = meta.getAttribute('content');
            if (key && content) {
                metadata[key] = content;
            }
        });

        return metadata;
    }

    isValidImage(img) {
        if (!img.src || img.src.startsWith('data:')) return false;
        if (img.width < 50 || img.height < 50) return false;
        if (img.style.display === 'none' || img.style.visibility === 'hidden') return false;
        
        const rect = img.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) return false;

        return true;
    }

    extractBackgroundImages() {
        const images = [];
        const elementsWithBg = document.querySelectorAll('*');
        
        elementsWithBg.forEach((element, index) => {
            const style = window.getComputedStyle(element);
            const bgImage = style.backgroundImage;
            
            if (bgImage && bgImage !== 'none') {
                const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (urlMatch && urlMatch[1]) {
                    const rect = element.getBoundingClientRect();
                    if (rect.width >= 100 && rect.height >= 100) {
                        images.push({
                            src: urlMatch[1],
                            alt: element.getAttribute('alt') || '',
                            title: element.getAttribute('title') || 'Background Image',
                            width: rect.width,
                            height: rect.height,
                            index: `bg-${index}`,
                            isBackground: true
                        });
                    }
                }
            }
        });
        
        return images;
    }

    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim()
            .substring(0, 10000);
    }
}

new WebpageAnalyzer();