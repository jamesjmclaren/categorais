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
        const prompt = `You are an AI tool curator. Analyze this potential AI tool and return ONLY a valid JSON object (no markdown, no explanation, just JSON).

Tool to analyze:
- Name: ${toolCandidate.name}
- URL: ${toolCandidate.url}
- Description: ${toolCandidate.description}

Return a JSON object with these exact fields:
{
    "name": "Official product name (clean, no extra text)",
    "description": "Clear 1-2 sentence description (max 150 chars)",
    "pricing": "free" or "freemium" or "paid",
    "features": ["feature1", "feature2", "feature3", "feature4", "feature5"],
    "isValidAITool": true or false,
    "suggestedCategory": "one of: chat, image, video, audio, code, writing, productivity, research, design, dating, health, education, gaming, finance, travel, customer-service, directory, enterprise"
}

Make sure the tool is actually an AI tool. Return isValidAITool: false if it's not.`;

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

        return {
            name: normalized.name,
            category: normalized.suggestedCategory || determineCategory(normalized.name, normalized.description),
            description: normalized.description,
            icon: getIconForCategory(normalized.suggestedCategory),
            logo: toolCandidate.logo || '',
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
        // Filter out non-tool pages
        const url = result.url.toLowerCase();
        const title = result.title.toLowerCase();

        // Skip certain domains
        if (url.includes('wikipedia.org') ||
            url.includes('youtube.com') ||
            url.includes('reddit.com') ||
            url.includes('linkedin.com') ||
            url.includes('twitter.com') ||
            url.includes('facebook.com')) {
            continue;
        }

        // Skip list/directory pages unless they're actual tools
        if ((title.includes('best') ||
             title.includes('top') ||
             title.includes('list')) &&
            !url.match(/\.(ai|io|com)$/)) {
            continue;
        }

        candidates.push({
            name: result.title.replace(/[^\w\s-]/g, '').trim(),
            url: result.url,
            description: result.description || '',
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
