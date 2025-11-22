#!/usr/bin/env node

/**
 * Backfill Popularity Script
 *
 * This script populates popularity scores for all existing tools in ai-tools.json
 * by searching Brave for each tool and calculating a score based on search volume.
 *
 * Usage:
 *   # Backfill all tools (will take ~12 minutes for 347 tools at 2s/tool)
 *   BRAVE_API_KEY=your_key node backfill-popularity.js
 *
 *   # Test with first 10 tools only
 *   BRAVE_API_KEY=your_key MAX_TOOLS=10 node backfill-popularity.js
 *
 * Environment Variables:
 *   BRAVE_API_KEY - Required. Your Brave Search API key
 *   MAX_TOOLS - Optional. Limit number of tools to process (for testing)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';
const TOOLS_FILE = path.join(__dirname, 'ai-tools.json');
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds to avoid rate limits
const MAX_TOOLS = process.env.MAX_TOOLS ? parseInt(process.env.MAX_TOOLS) : null; // Limit for testing

// Popularity calculation (same as in ai-discovery-agent.js)
function calculatePopularity(searchCount) {
    if (!searchCount || searchCount === 0) return 50;
    const score = Math.min(50 + Math.log10(searchCount) * 10, 100);
    return Math.round(score);
}

// Search Brave for a tool and get result count
async function searchBrave(toolName) {
    if (!BRAVE_API_KEY) {
        throw new Error('BRAVE_API_KEY environment variable is required');
    }

    const query = `${toolName} AI tool`;
    const url = `${BRAVE_SEARCH_URL}?q=${encodeURIComponent(query)}&count=5`;

    try {
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
        const totalCount = data.web?.totalCount || 0;

        return totalCount;
    } catch (error) {
        console.error(`   ❌ Error searching for "${toolName}":`, error.message);
        return 0;
    }
}

// Delay helper
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main backfill function
async function backfillPopularity() {
    console.log('🚀 Starting popularity backfill...\n');

    // Read existing tools
    let tools;
    try {
        const data = fs.readFileSync(TOOLS_FILE, 'utf-8');
        tools = JSON.parse(data);
        console.log(`📚 Found ${tools.length} tools in database\n`);
    } catch (error) {
        console.error('❌ Error reading ai-tools.json:', error.message);
        process.exit(1);
    }

    // Filter tools that need popularity scores
    let toolsNeedingScores = tools.filter(tool =>
        !tool.popularity || tool.popularity === 50
    );

    // Limit for testing if MAX_TOOLS is set
    if (MAX_TOOLS && MAX_TOOLS > 0) {
        console.log(`🔍 Limiting to first ${MAX_TOOLS} tools (MAX_TOOLS=${MAX_TOOLS})\n`);
        toolsNeedingScores = toolsNeedingScores.slice(0, MAX_TOOLS);
    }

    console.log(`🔍 ${toolsNeedingScores.length} tools need popularity scores\n`);

    if (toolsNeedingScores.length === 0) {
        console.log('✅ All tools already have popularity scores!');
        return;
    }

    let updated = 0;
    let failed = 0;

    // Process each tool
    for (let i = 0; i < toolsNeedingScores.length; i++) {
        const tool = toolsNeedingScores[i];
        const progress = `[${i + 1}/${toolsNeedingScores.length}]`;

        console.log(`${progress} Processing: ${tool.name}`);

        try {
            // Search Brave for this tool
            const searchCount = await searchBrave(tool.name);
            const popularity = calculatePopularity(searchCount);

            // Find the tool in the original array and update it
            const toolIndex = tools.findIndex(t => t.name === tool.name);
            if (toolIndex !== -1) {
                tools[toolIndex].popularity = popularity;
                console.log(`   ✅ Popularity: ${popularity} (${searchCount.toLocaleString()} results)`);
                updated++;
            }

            // Add delay to avoid rate limits
            if (i < toolsNeedingScores.length - 1) {
                await delay(DELAY_BETWEEN_REQUESTS);
            }
        } catch (error) {
            console.error(`   ❌ Failed:`, error.message);
            failed++;
        }
    }

    // Save updated tools
    try {
        fs.writeFileSync(TOOLS_FILE, JSON.stringify(tools, null, 2));
        console.log(`\n✅ Successfully updated ${updated} tools`);
        if (failed > 0) {
            console.log(`⚠️  Failed to update ${failed} tools`);
        }

        // Show top 10 most popular tools
        const topTools = [...tools]
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 10);

        console.log('\n🏆 Top 10 Most Popular Tools:');
        topTools.forEach((tool, idx) => {
            console.log(`   ${idx + 1}. ${tool.name} - Popularity: ${tool.popularity || 50}`);
        });

    } catch (error) {
        console.error('\n❌ Error saving ai-tools.json:', error.message);
        process.exit(1);
    }
}

// Run the backfill
backfillPopularity().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
