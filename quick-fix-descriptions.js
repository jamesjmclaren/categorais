#!/usr/bin/env node

/**
 * Quick fix script - Removes obvious bad content from descriptions
 * Doesn't use API - just removes HTML tags, truncated text, etc.
 */

const fs = require('fs');
const path = require('path');

const AI_TOOLS_FILE = path.join(__dirname, 'ai-tools.json');

function cleanDescription(desc, toolName) {
    if (!desc) return '';

    // Remove HTML tags
    let cleaned = desc.replace(/<[^>]*>/g, '');

    // Remove "We performed..." type content
    cleaned = cleaned.replace(/^We performed.*?(?:winner|evaluation)\.\s*/i, '');

    // Remove trailing incomplete sentences with ...
    cleaned = cleaned.replace(/\.\.\.\s*[A-Z].*$/, '.');
    cleaned = cleaned.replace(/\s*\.\.\.\s*$/, '');

    // If it starts with article-like text, just use tool name
    if (cleaned.match(/^(Explore|Discover|The Best|These AI|Create|Free)/i)) {
        // Try to extract a meaningful part
        const sentences = cleaned.split(/[.!?]+/);
        if (sentences.length > 1) {
            cleaned = sentences[1].trim();
        }
    }

    // Limit length
    if (cleaned.length > 150) {
        cleaned = cleaned.substring(0, 147) + '...';
    }

    // If too short or empty, create basic description
    if (cleaned.length < 20) {
        cleaned = `AI-powered tool for ${toolName.toLowerCase().replace(/[^a-z\s]/g, '')}`;
    }

    return cleaned.trim();
}

console.log('🔧 Quick cleaning of descriptions...\n');

const tools = JSON.parse(fs.readFileSync(AI_TOOLS_FILE, 'utf-8'));
console.log(`📚 Loaded ${tools.length} tools\n`);

let fixed = 0;

tools.forEach(tool => {
    const original = tool.description;
    const cleaned = cleanDescription(tool.description, tool.name);

    if (cleaned !== original) {
        tool.description = cleaned;
        fixed++;
        console.log(`✅ Fixed: ${tool.name}`);
    }
});

console.log(`\n📊 Fixed ${fixed} descriptions\n`);

fs.writeFileSync(AI_TOOLS_FILE, JSON.stringify(tools, null, 4), 'utf-8');
console.log(`💾 Saved to ${AI_TOOLS_FILE}\n`);
