# AI Discovery Agent

Automated tool for discovering, verifying, and categorizing new AI tools using Brave Search and Groq LLM.

## 🚀 Features

- **Automated Discovery**: Uses Brave Search API to find new AI tools across multiple categories
- **Smart Deduplication**: Automatically filters out tools that already exist in your database
- **AI-Powered Verification**: Uses Groq's LLM to verify, normalize, and enrich tool data
- **Bad Tool Detection**: Filters out articles, directories, tutorials, and generic pages
- **Intelligent Logo Fetching**: Uses Clearbit API and known logo sources for high-quality logos
- **Auto-Categorization**: Intelligently categorizes tools based on their features and description
- **GitHub Actions Integration**: Runs automatically on a schedule or manually via workflow dispatch

## 📋 Prerequisites

1. **Brave Search API Key**: Get one at [https://brave.com/search/api/](https://brave.com/search/api/)
2. **Groq API Key**: Get one at [https://console.groq.com/](https://console.groq.com/)
3. **Node.js**: Version 18 or higher

## 🔧 Setup

### 1. Add API Keys to GitHub Secrets

Go to your repository settings and add these secrets:

- `BRAVE_API_KEY`: Your Brave Search API key
- `GROQ_API_KEY`: Your Groq API key

**Or for local development**, set environment variables:

```bash
export BRAVE_API_KEY="your_brave_api_key"
export GROQ_API_KEY="your_groq_api_key"
```

### 2. Install Dependencies

```bash
npm install
```

## 🎯 Usage

### Run Locally

```bash
# Discover up to 3 tools per search query (default)
npm run discover

# Fast mode - 2 tools per query
npm run discover:fast

# Deep mode - 5 tools per query
npm run discover:deep

# Custom amount
node ai-discovery-agent.js 10
```

### Run via GitHub Actions

The agent runs automatically every day at 2 AM UTC. You can also trigger it manually:

1. Go to **Actions** tab in your repository
2. Select **Discover New AI Tools** workflow
3. Click **Run workflow**
4. Optionally specify max tools per query (default: 3)

## 🔍 How It Works

### 1. Search Phase

The agent uses 25+ carefully crafted search queries to find AI tools:

```javascript
- "new AI chatbot 2025"
- "AI image generator tool"
- "AI video creation platform"
- "AI coding assistant"
// ... and more
```

### 2. Filtering Phase

For each search result:
- Extracts tool candidates
- Filters out non-tool pages (Wikipedia, Reddit, Medium, Quora, etc.)
- Detects and skips articles, directories, tutorials using pattern matching
- Checks for duplicates by domain and name
- Validates against bad tool patterns (e.g., "Top 10", "Best X", "How to")

### 3. Normalization Phase

For each unique candidate, Groq LLM:
- Verifies it's actually an AI tool (not an article or directory)
- Normalizes the name and description
- Determines pricing tier (free/freemium/paid)
- Extracts 5 key features
- Suggests the best category
- Fetches best logo from:
  1. Known logos database (17+ popular tools)
  2. Clearbit Logo API
  3. Search result thumbnail (fallback)

### 4. Categorization Phase

Tools are categorized into:
- `chat` - Chat & AI Assistants
- `image` - AI Image Generation
- `video` - AI Video Creation
- `audio` - AI Audio & Music
- `code` - AI Code & Development
- `writing` - AI Writing & Content
- `productivity` - AI Productivity
- `research` - AI Research
- `design` - AI Design
- `dating` - AI Dating
- `health` - AI Health
- `education` - AI Education
- `gaming` - AI Gaming
- `finance` - AI Finance
- `travel` - AI Travel
- `customer-service` - AI Customer Service
- `directory` - AI Directories
- `enterprise` - Enterprise AI

### 5. Save Phase

New tools are merged with existing ones and saved to `ai-tools.json`.

## 📊 Output Format

Each discovered tool follows this structure:

```json
{
    "name": "Tool Name",
    "category": "chat",
    "description": "Brief description under 150 characters",
    "icon": "💬",
    "logo": "https://example.com/logo.png",
    "pricing": "freemium",
    "url": "https://example.com",
    "features": [
        "Feature 1",
        "Feature 2",
        "Feature 3",
        "Feature 4",
        "Feature 5"
    ]
}
```

## ⚙️ Configuration

### Adjust Search Queries

Edit the `SEARCH_QUERIES` array in `ai-discovery-agent.js`:

```javascript
const SEARCH_QUERIES = [
    'your custom search query',
    'another query',
    // ...
];
```

### Adjust Categories

Edit the `CATEGORY_KEYWORDS` object to add or modify categories:

```javascript
const CATEGORY_KEYWORDS = {
    'new-category': ['keyword1', 'keyword2', 'keyword3'],
    // ...
};
```

### Rate Limiting

The agent includes built-in rate limiting:
- 1 second between Groq API calls
- 2 seconds between search queries

Adjust these in the code if needed:

```javascript
// After Groq call
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second

// After search query
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
```

## 📈 Performance

With default settings (3 tools per query):
- **Queries**: 25 search queries
- **API Calls**: ~75 Groq API calls (assuming 3 unique tools per query)
- **Runtime**: ~5-10 minutes
- **Expected Results**: 10-30 new tools per run

## 🛠️ Troubleshooting

### No Tools Discovered

- Check that your API keys are set correctly
- Verify you have API credits remaining
- Check if the tools found are all duplicates

### API Rate Limits

If you hit rate limits:
1. Reduce `maxPerQuery` parameter
2. Increase sleep times between calls
3. Reduce number of search queries

### Invalid API Keys

```bash
❌ Missing API keys. Please set BRAVE_API_KEY and GROQ_API_KEY environment variables.
```

Make sure both API keys are set in GitHub Secrets or environment variables.

## 📝 Example Output

```
🔍 Starting AI tool discovery...

📚 Loaded 235 existing tools

[1/25] Searching: "new AI chatbot 2025"
   Found 20 search results
   Extracted 8 tool candidates
   ⏭️  Skipping duplicate: ChatGPT
   ⏭️  Skipping bad tool: Top 10 AI Chatbots for 2025
   🔄 Normalizing: SuperChat AI...
   ✅ Added: SuperChat AI [chat]
   🔄 Normalizing: ThinkBot...
   ⚠️  Skipping "Best AI Tools Directory" - not a valid AI tool
   ✅ Added: ThinkBot [chat]
   ⏭️  Reached max 3 tools per query

[2/25] Searching: "AI image generator tool"
...

============================================================
📊 Discovery Summary:
   Total search queries: 25
   Total candidates found: 187
   Duplicates filtered: 142
   New tools discovered: 23
============================================================

🆕 New tools discovered:
   1. SuperChat AI (chat) - freemium
   2. ThinkBot (chat) - free
   3. PixelForge (image) - paid
   ...

✅ Saved 476 tools to ai-tools.json

✨ Total tools in database: 476
```

## 🤝 Contributing

To improve the discovery agent:

1. Add more targeted search queries
2. Improve category detection keywords
3. Enhance filtering logic
4. Add new tool categories

## 📄 License

MIT License - See main repository for details.
