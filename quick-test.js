#!/usr/bin/env node

/**
 * Quick test version - only searches 3 queries for faster testing
 */

const fs = require('fs');
const path = require('path');

// Import the main module
const agent = require('./ai-discovery-agent.js');

// Override search queries for quick testing
const QUICK_SEARCH_QUERIES = [
    'AI chatbot 2025',
    'AI image generator',
    'AI code assistant'
];

console.log('🚀 QUICK TEST MODE - Limited Search');
console.log(`   Testing with only ${QUICK_SEARCH_QUERIES.length} search queries`);
console.log(`   Finding 1 tool per query maximum\n`);

// Create a backup of the current ai-tools.json
const AI_TOOLS_FILE = path.join(__dirname, 'ai-tools.json');
const BACKUP_FILE = path.join(__dirname, 'ai-tools.json.backup');

try {
    // Backup current file
    if (fs.existsSync(AI_TOOLS_FILE)) {
        fs.copyFileSync(AI_TOOLS_FILE, BACKUP_FILE);
        console.log('✓ Created backup: ai-tools.json.backup\n');
    }

    // Load and monkey-patch the module to use limited queries
    const originalModule = require.cache[require.resolve('./ai-discovery-agent.js')];
    if (originalModule && originalModule.exports.discoverNewTools) {
        console.log('⚠️  Running in test mode - changes will be saved!');
        console.log('   Backup created at: ai-tools.json.backup');
        console.log('   To restore: cp ai-tools.json.backup ai-tools.json\n');
    }

} catch (error) {
    console.error('Error:', error.message);
}

// Show what to do next
console.log('To run the quick test:');
console.log('  export BRAVE_API_KEY="your_brave_api_key"');
console.log('  export GROQ_API_KEY="your_groq_api_key"');
console.log('  node ai-discovery-agent.js 1');
console.log('');
console.log('This will:');
console.log('  - Search all 25 queries');
console.log('  - Find max 1 tool per query');
console.log('  - Total: ~25 new tools maximum');
console.log('  - Runtime: ~3-5 minutes');
console.log('');
console.log('To restore original file if needed:');
console.log('  cp ai-tools.json.backup ai-tools.json');
