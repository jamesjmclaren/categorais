#!/usr/bin/env node

/**
 * AI Discovery Agent
 * Uses Brave Search to find new AI tools and Groq to normalize and verify them
 */

const fs = require('fs');
const path = require('path');

// Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const AI_TOOLS_FILE = path.join(__dirname, 'ai-tools.json');
const LEARNED_CATEGORIES_FILE = path.join(__dirname, 'learned-categories.json');

// Known good logos for popular tools
const KNOWN_LOGOS = {
    'ChatGPT': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/2048px-ChatGPT_logo.svg.png',
    'Claude': 'https://claude.ai/images/claude_app_icon.png',
    'Gemini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/2560px-Google_Gemini_logo.svg.png',
    'Perplexity AI': 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png',
    'Midjourney': 'https://seeklogo.com/images/M/midjourney-logo-3BAF817FF7-seeklogo.com.png',
    'DALL-E': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/2048px-ChatGPT_logo.svg.png',
    'Stable Diffusion': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Stability_AI_logo.svg/2560px-Stability_AI_logo.svg.png',
    'Runway': 'https://seeklogo.com/images/R/runway-logo-3847553E3E-seeklogo.com.png',
    'Synthesia': 'https://seeklogo.com/images/S/synthesia-logo-3F8F6B7A91-seeklogo.com.png',
    'ElevenLabs': 'https://seeklogo.com/images/E/elevenlabs-logo-8DB349FD2F-seeklogo.com.png',
    'GitHub Copilot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/2048px-GitHub_Invertocat_Logo.svg.png',
    'Cursor': 'https://cursor.sh/favicon.svg',
    'Grammarly': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Grammarly_logo.svg/2560px-Grammarly_logo.svg.png',
    'Canva': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Canva_icon_2021.svg/2048px-Canva_icon_2021.svg.png',
    'Figma': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/1667px-Figma-logo.svg.png',
    'Notion AI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Notion-logo.svg/2048px-Notion-logo.svg.png',
    'Copy.ai': 'https://avatars.githubusercontent.com/u/74709768',
    'Jasper': 'https://www.jasper.ai/favicon.ico'
};

// Search queries for finding AI tools (inspired by existing tools)
const SEARCH_QUERIES = [
    // Specific AI categories
    'new AI chatbot 2025',
    'AI image generator tool',
    'AI video creation platform',
    'AI coding assistant',
    'AI writing tool',
    'AI voice generator',
    'AI music generator',
    'AI productivity tool',
    'AI design tool',
    'AI research assistant',

    // Emerging categories
    'AI avatar generator',
    'AI presentation maker',
    'AI data analysis tool',
    'AI meeting assistant',
    'AI note taking app',
    'AI email assistant',
    'AI social media tool',
    'AI marketing automation',
    'AI customer support',
    'AI translation tool',

    // Trending searches
    'best free AI tools 2025',
    'AI tools for developers',
    'AI tools for content creators',
    'AI automation platform',
    'generative AI application'
];

// Category mapping
const CATEGORY_KEYWORDS = {
    chat: ['chatbot', 'conversation', 'assistant', 'chat', 'ai chat'],
    image: ['image', 'photo', 'picture', 'art', 'visual', 'illustration', 'graphics'],
    video: ['video', 'film', 'movie', 'animation', 'clips'],
    audio: ['audio', 'voice', 'music', 'sound', 'speech', 'podcast'],
    code: ['code', 'coding', 'programming', 'developer', 'github', 'IDE'],
    writing: ['writing', 'content', 'blog', 'article', 'copywriting', 'text'],
    productivity: ['productivity', 'task', 'organize', 'workflow', 'efficiency'],
    research: ['research', 'analysis', 'data', 'insights', 'study'],
    design: ['design', 'ui', 'ux', 'prototype', 'mockup', 'creative'],
    dating: ['dating', 'relationship', 'match', 'romance'],
    health: ['health', 'fitness', 'medical', 'wellness', 'healthcare'],
    education: ['education', 'learning', 'teaching', 'training', 'course'],
    gaming: ['gaming', 'game', 'esports', 'entertainment'],
    finance: ['finance', 'trading', 'investment', 'accounting', 'money'],
    travel: ['travel', 'trip', 'booking', 'tourism', 'hotel'],
    'customer-service': ['customer service', 'support', 'help desk', 'crm'],
    directory: ['directory', 'catalog', 'marketplace', 'platform'],
    enterprise: ['enterprise', 'business', 'corporate', 'b2b', 'saas']
};

/**
 * Load existing AI tools from JSON file
 */
function loadExistingTools() {
    try {
        const data = fs.readFileSync(AI_TOOLS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading existing tools:', error.message);
        return [];
    }
}

/**
 * Save tools to JSON file
 */
function saveTools(tools) {
    try {
        const data = JSON.stringify(tools, null, 4);
        fs.writeFileSync(AI_TOOLS_FILE, data, 'utf8');
        console.log(`✅ Saved ${tools.length} tools to ${AI_TOOLS_FILE}`);
        return true;
    } catch (error) {
        console.error('Error saving tools:', error.message);
        return false;
    }
}

/**
 * Search Brave for AI tools
 */
async function searchBrave(query, count = 20) {
    try {
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'X-Subscription-Token': BRAVE_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Brave API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.web?.results || [];
    } catch (error) {
        console.error(`Error searching Brave for "${query}":`, error.message);
        return [];
    }
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return null;
    }
}

/**
 * Detect bad tools (articles, directories, tutorials)
 */
function detectBadTool(name, url, description) {
    const lowerName = name.toLowerCase();
    const lowerUrl = url.toLowerCase();
    const lowerDesc = description.toLowerCase();

    // Bad patterns in name
    const badPatterns = [
        /^top \d+/i,
        /^best \d+/i,
        /^\d+ best/i,
        /tools? for/i,
        /discover top/i,
        /build a.*app/i,
        /free ai.*online$/i,
        /everything you need/i,
        /no\.\d+/i,
        /i tested/i,
        /introducing/i,
        /tools? directory/i,
        /frameworks? & tools/i,
        /review:/i,
        /guide:/i,
        /how to/i,
        /tutorial/i,
        /comparison/i,
    ];

    for (const pattern of badPatterns) {
        if (pattern.test(lowerName)) {
            return true;
        }
    }

    // Generic names
    const genericNames = [
        'ai chat', 'ai chatbot', 'chatbot app', 'free ai chat',
        'ai image generator', 'ai video generator', 'ai voice generator',
        'ai music generator', 'free ai', 'ai tools', 'ai assistant',
        'ai tool', 'online ai', 'free ai tool'
    ];

    if (genericNames.includes(lowerName)) {
        return true;
    }

    // Bad URL patterns
    const badUrlPatterns = [
        '/blog/', '/article/', '/review', '/best-',
        '/top-', '/guide/', '/tutorial/', '/how-to/',
        '/vs-', '/comparison', '/alternatives'
    ];

    for (const pattern of badUrlPatterns) {
        if (lowerUrl.includes(pattern)) {
            return true;
        }
    }

    // Check for directory/marketplace indicators
    if ((lowerName.includes('directory') || lowerName.includes('marketplace')) &&
        !lowerUrl.match(/\.(ai|io)$/)) {
        return true;
    }

    return false;
}

/**
 * Get best logo for a tool
 */
async function getBestLogo(toolName, toolUrl, currentLogo = '') {
    // Check known logos first
    if (KNOWN_LOGOS[toolName]) {
        return KNOWN_LOGOS[toolName];
    }

    // If current logo is from a trusted source, keep it
    const trustedSources = [
        'wikipedia.org',
        'seeklogo.com',
        'upload.wikimedia.org',
        'uxwing.com',
        'cloudflare.com'
    ];

    for (const source of trustedSources) {
        if (currentLogo && currentLogo.includes(source)) {
            return currentLogo;
        }
    }

    // Try Clearbit Logo API
    try {
        const domain = extractDomain(toolUrl);
        if (domain) {
            const clearbitUrl = `https://logo.clearbit.com/${domain}`;
            // Test if logo exists
            const response = await fetch(clearbitUrl, { method: 'HEAD' });
            if (response.ok) {
                return clearbitUrl;
            }
        }
    } catch (error) {
        // Silently fail, will use current logo
    }

    return currentLogo;
}

/**
 * Check if tool already exists
 */
function isDuplicate(toolUrl, toolName, existingTools) {
    const domain = extractDomain(toolUrl);
    if (!domain) return true;

    // Check by URL/domain
    const domainExists = existingTools.some(tool => {
        const existingDomain = extractDomain(tool.url);
        return existingDomain === domain;
    });

    // Check by name (case insensitive)
    const nameExists = existingTools.some(tool =>
        tool.name.toLowerCase() === toolName.toLowerCase()
    );

    return domainExists || nameExists;
}

/**
 * Determine category based on description and name
 */
function determineCategory(name, description) {
    const text = `${name} ${description}`.toLowerCase();
    let bestMatch = 'productivity'; // default
    let highestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        const score = keywords.filter(keyword => text.includes(keyword)).length;
        if (score > highestScore) {
            highestScore = score;
            bestMatch = category;
        }
    }

    return bestMatch;
}

/**
 * Use Groq to normalize and verify tool information
 */
async function normalizeWithGroq(toolCandidate) {
    try {
        // Pre-check for bad tools
        if (detectBadTool(toolCandidate.name, toolCandidate.url, toolCandidate.description)) {
            console.log(`   ⏭️  Skipping bad tool: ${toolCandidate.name}`);
            return null;
        }

        const prompt = `You are an AI tool curator. Analyze this potential AI tool and return ONLY a valid JSON object (no markdown, no explanation, just JSON).

Tool to analyze:
- Name: ${toolCandidate.name}
- URL: ${toolCandidate.url}
- Description: ${toolCandidate.description}

IMPORTANT: Return isValidAITool: false if this is:
- An article, blog post, or review
- A directory or marketplace (unless it IS an AI tool itself)
- A tutorial or guide
- A generic description without a specific product

Return a JSON object with these exact fields:
{
    "name": "Official product name (clean, no extra text)",
    "description": "Clear 1-2 sentence description (max 150 chars)",
    "pricing": "free" or "freemium" or "paid",
    "features": ["feature1", "feature2", "feature3", "feature4", "feature5"],
    "isValidAITool": true or false,
    "suggestedCategory": "one of: chat, image, video, audio, code, writing, productivity, research, design, dating, health, education, gaming, finance, travel, customer-service, directory, enterprise"
}

Make sure the tool is actually an AI tool with a real product/service. Return isValidAITool: false if it's not.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a JSON generator. Return ONLY valid JSON, no markdown formatting, no explanation.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let content = data.choices[0]?.message?.content?.trim();

        // Remove markdown code blocks if present
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const normalized = JSON.parse(content);

        // Validate the response
        if (!normalized.isValidAITool) {
            console.log(`⚠️  Skipping "${toolCandidate.name}" - not a valid AI tool`);
            return null;
        }

        // Get best logo
        const bestLogo = await getBestLogo(
            normalized.name,
            toolCandidate.url,
            toolCandidate.logo
        );

        return {
            name: normalized.name,
            category: normalized.suggestedCategory || determineCategory(normalized.name, normalized.description),
            description: normalized.description,
            icon: getIconForCategory(normalized.suggestedCategory),
            logo: bestLogo,
            pricing: normalized.pricing,
            url: toolCandidate.url,
            features: normalized.features || []
        };

    } catch (error) {
        console.error(`Error normalizing with Groq for "${toolCandidate.name}":`, error.message);
        return null;
    }
}

/**
 * Get icon for category
 */
function getIconForCategory(category) {
    const icons = {
        chat: '💬',
        image: '🎨',
        video: '🎬',
        audio: '🎵',
        code: '💻',
        writing: '✍️',
        productivity: '⚡',
        research: '🔬',
        design: '🎨',
        dating: '❤️',
        health: '🏥',
        education: '📚',
        gaming: '🎮',
        finance: '💰',
        travel: '✈️',
        'customer-service': '📞',
        directory: '📂',
        enterprise: '🏢'
    };
    return icons[category] || '🤖';
}

/**
 * Extract tool candidates from search results
 */
function extractCandidates(searchResults) {
    const candidates = [];

    for (const result of searchResults) {
        const url = result.url.toLowerCase();
        const title = result.title;
        const description = result.description || '';

        // Skip certain domains
        if (url.includes('wikipedia.org') ||
            url.includes('youtube.com') ||
            url.includes('reddit.com') ||
            url.includes('linkedin.com') ||
            url.includes('twitter.com') ||
            url.includes('facebook.com') ||
            url.includes('quora.com') ||
            url.includes('medium.com')) {
            continue;
        }

        // Clean up title
        const cleanName = title.replace(/[^\w\s-]/g, '').trim();

        // Use detectBadTool to filter out articles, directories, etc.
        if (detectBadTool(cleanName, result.url, description)) {
            continue;
        }

        candidates.push({
            name: cleanName,
            url: result.url,
            description: description,
            logo: result.thumbnail?.src || ''
        });
    }

    return candidates;
}

/**
 * Discover new AI tools
 */
async function discoverNewTools(maxPerQuery = 3) {
    console.log('🔍 Starting AI tool discovery...\n');

    if (!BRAVE_API_KEY || !GROQ_API_KEY) {
        console.error('❌ Missing API keys. Please set BRAVE_API_KEY and GROQ_API_KEY environment variables.');
        process.exit(1);
    }

    const existingTools = loadExistingTools();
    console.log(`📚 Loaded ${existingTools.length} existing tools\n`);

    const newTools = [];
    let totalCandidates = 0;
    let duplicates = 0;

    for (let i = 0; i < SEARCH_QUERIES.length; i++) {
        const query = SEARCH_QUERIES[i];
        console.log(`\n[${i + 1}/${SEARCH_QUERIES.length}] Searching: "${query}"`);

        const results = await searchBrave(query);
        console.log(`   Found ${results.length} search results`);

        const candidates = extractCandidates(results);
        totalCandidates += candidates.length;
        console.log(`   Extracted ${candidates.length} tool candidates`);

        let addedFromQuery = 0;

        for (const candidate of candidates) {
            if (addedFromQuery >= maxPerQuery) {
                console.log(`   ⏭️  Reached max ${maxPerQuery} tools per query`);
                break;
            }

            // Check for duplicates
            if (isDuplicate(candidate.url, candidate.name, [...existingTools, ...newTools])) {
                duplicates++;
                console.log(`   ⏭️  Skipping duplicate: ${candidate.name}`);
                continue;
            }

            console.log(`   🔄 Normalizing: ${candidate.name}...`);

            // Normalize with Groq
            const normalized = await normalizeWithGroq(candidate);

            if (normalized) {
                newTools.push(normalized);
                addedFromQuery++;
                console.log(`   ✅ Added: ${normalized.name} [${normalized.category}]`);
            }

            // Rate limiting - wait 1 second between Groq calls
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Wait between search queries
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Discovery Summary:');
    console.log(`   Total search queries: ${SEARCH_QUERIES.length}`);
    console.log(`   Total candidates found: ${totalCandidates}`);
    console.log(`   Duplicates filtered: ${duplicates}`);
    console.log(`   New tools discovered: ${newTools.length}`);
    console.log('='.repeat(60) + '\n');

    if (newTools.length > 0) {
        console.log('🆕 New tools discovered:');
        newTools.forEach((tool, idx) => {
            console.log(`   ${idx + 1}. ${tool.name} (${tool.category}) - ${tool.pricing}`);
        });

        // Merge and save
        const allTools = [...existingTools, ...newTools];

        // Sort by category then name
        allTools.sort((a, b) => {
            if (a.category === b.category) {
                return a.name.localeCompare(b.name);
            }
            return a.category.localeCompare(b.category);
        });

        saveTools(allTools);
        console.log(`\n✨ Total tools in database: ${allTools.length}`);
    } else {
        console.log('ℹ️  No new tools discovered in this run.');
    }
}

// Run the agent
if (require.main === module) {
    const maxPerQuery = parseInt(process.argv[2]) || 3;
    discoverNewTools(maxPerQuery).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { discoverNewTools, loadExistingTools, saveTools };
