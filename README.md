# AI Webpage Analyzer - Safari Extension

A powerful Safari extension that leverages AI to analyze webpages with three core features: intelligent page summarization, interactive image galleries, and sentiment analysis.

## Features

### 🤖 AI-Powered Analysis
- **Page Summary**: Get concise, AI-generated summaries of any webpage
- **Sentiment Analysis**: Analyze the emotional tone of content (joyful, neutral, or toxic)
- **Configurable AI Models**: Choose between OpenAI (GPT-4, GPT-3.5) and Anthropic (Claude) models

### 🖼️ Image Gallery
- Interactive carousel of all page images
- Thumbnail navigation with click-to-view
- Support for both regular images and CSS background images
- Smart filtering of decorative/small images

### ⚙️ Advanced Configuration
- Secure API key management
- Model selection interface
- Customizable summary length
- Adjustable image gallery limits
- One-click API connection testing

## Installation

### Prerequisites
- Safari 14+ (macOS Big Sur or later)
- An API key from either:
  - [OpenAI](https://platform.openai.com/api-keys) (requires billing setup)
  - [Anthropic](https://console.anthropic.com/) (Claude API)

### Setup Steps

1. **Clone or Download** this repository
2. **Open Safari** and go to Safari → Preferences → Advanced
3. **Enable "Show Develop menu"** checkbox
4. **Go to Develop menu** → "Allow Unsigned Extensions"
5. **Load the extension**:
   - Go to Safari → Preferences → Extensions
   - Click the "+" button and select this extension folder
   - Enable the "AI Webpage Analyzer" extension

### Configuration

1. **Click the extension icon** in Safari's toolbar
2. **Click the settings gear** icon or "Open Settings" button
3. **Select your AI provider** (OpenAI or Anthropic)
4. **Choose your preferred model**:
   - OpenAI: GPT-4, GPT-4 Turbo, or GPT-3.5 Turbo
   - Anthropic: Claude 3 Opus, Sonnet, or Haiku
5. **Enter your API key** (click the eye icon to show/hide)
6. **Test the connection** to verify your setup
7. **Save your settings**

## Usage

### Page Summary
1. Navigate to any webpage
2. Click the extension icon
3. Click "Page Summary"
4. Wait for AI analysis (usually 2-5 seconds)
5. Read the generated summary in the popup

### Image Gallery
1. Navigate to any webpage with images
2. Click the extension icon
3. Click "Image Gallery"
4. Browse images using:
   - Navigation arrows (‹ ›)
   - Thumbnail clicks
   - View image metadata (dimensions, alt text)

### Sentiment Analysis
1. Navigate to any webpage with text content
2. Click the extension icon
3. Click "Sentiment Analysis"
4. View the analysis results:
   - Sentiment category (Joyful/Neutral/Toxic)
   - Confidence percentage
   - AI explanation of the analysis

## Privacy & Security

- **API keys are stored locally** in Safari's secure storage
- **No data is sent to our servers** - analysis happens directly between your browser and your chosen AI provider
- **Content extraction is temporary** - webpage content is only processed during active analysis
- **HTTPS-only connections** to AI providers

## Customization Options

### Summary Settings
- **Short**: 1-2 sentences
- **Medium**: 3-4 sentences (default)
- **Long**: 1-2 paragraphs

### Gallery Settings
- **Image limits**: 10, 20, 50, or 100 images
- **Smart filtering**: Automatically excludes decorative images under 50px

## Troubleshooting

### Common Issues

**"Please configure your AI settings first"**
- Solution: Click settings and add your API provider and key

**"API connection failed"**
- Check your API key is correct
- Verify your API provider account has available credits
- Test connection in settings

**"No images found"**
- Some pages may not have qualifying images (>50px dimensions)
- Try a different webpage with more visual content

**Extension not appearing**
- Ensure "Allow Unsigned Extensions" is enabled in Safari's Develop menu
- Check that the extension is enabled in Safari Preferences → Extensions

### API Costs
- **OpenAI**: Pay-per-use pricing, typically $0.01-0.03 per analysis
- **Anthropic**: Pay-per-use pricing, similar cost structure
- Monitor your usage through your provider's dashboard

## Technical Details

### File Structure
```
AISafariExtension/
├── manifest.json          # Extension configuration
├── popup.html             # Main interface
├── popup.js               # Popup functionality
├── popup.css              # Popup styling
├── options.html           # Settings page
├── options.js             # Settings functionality
├── options.css            # Settings styling
├── content.js             # Webpage content extraction
├── background.js          # AI API communication
├── icons/                 # Extension icons
└── README.md              # This file
```

### Browser Compatibility
- **Safari 14+** (macOS Big Sur or later)
- Uses modern JavaScript (ES6+)
- Responsive design for various popup sizes

## Development

### Local Development
1. Make changes to the source files
2. Reload the extension in Safari Preferences → Extensions
3. Test functionality on various websites

### Adding New AI Providers
1. Update the `models` object in `options.js`
2. Add API integration in `background.js`
3. Include setup instructions in `options.html`

## Support

For issues, feature requests, or questions:
1. Check the troubleshooting section above
2. Verify your API provider documentation
3. Test with different websites to isolate issues

## License

This project is provided as-is for educational and personal use.

---

**Note**: This extension requires active internet connection and valid AI provider API keys to function. Analysis quality depends on the chosen AI model and webpage content quality.