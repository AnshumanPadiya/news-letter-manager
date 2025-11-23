# Newsletter Manager 📧

A Chrome extension that helps you take control of your newsletter subscriptions by automatically analyzing, summarizing, and organizing your newsletters using AI.

## 🌟 Features

### 📊 **AI-Powered Newsletter Analysis**
- **Multi-AI Model Support**: Leverages both OpenAI and Google Gemini for intelligent newsletter processing
- **Smart Fallback System**: Automatically switches between OpenAI → Gemini → heuristics for robust processing
- **Intelligent Summarization**: Generates concise summaries of your newsletter content
- **Newsletter Detection**: Accurately identifies and categorizes newsletters from your inbox

### 📧 **Weekly Digest**
- Receive a comprehensive weekly digest of your newsletters
- AI-generated summaries help you quickly scan what matters
- Automatic scheduling ensures you never miss important updates

### 🛠️ **Flexible Configuration**
- Configure API keys for both OpenAI and Google Gemini (both optional)
- Schedule customization for when you want to receive digests
- Manual "Run Now" option for on-demand analysis

### 🧹 **Email Management**
- Automatically labels processed newsletters
- Optional cleanup feature to delete processed emails
- View pending cleanup count before deletion

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + Material-UI (MUI)
- **Build Tool**: Vite
- **AI Models**: 
  - OpenAI GPT
  - Google Gemini
- **APIs**: Gmail API with OAuth2 authentication
- **Extension Platform**: Chrome Extension Manifest V3

## 🔧 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 💡 Usage

1. **Configure API Keys** (Optional but recommended):
   - Click the extension icon
   - Go to Settings
   - Add your OpenAI API key and/or Google Gemini API key

2. **Authenticate with Gmail**:
   - The extension will prompt you to sign in with your Google account
   - Grant the necessary permissions

3. **Run Analysis**:
   - Click "Run Analysis Now" to immediately process newsletters
   - Or wait for the scheduled weekly run

4. **Manage Emails**:
   - View pending cleanup count
   - Use the cleanup feature to remove processed emails

## 🛡️ Permissions

The extension requires the following permissions:
- **Gmail Access**: To read and modify your newsletter emails
- **Storage**: To save settings and processed email data
- **Identity**: For Google OAuth authentication
- **Alarms**: For scheduled weekly digest generation

## 🔒 Privacy

Your API keys and email data are stored locally in your browser and are never sent to third-party servers except for the AI model providers (OpenAI/Google) you've configured.

## 📝 Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## 📄 License

This project is private and not licensed for redistribution.
