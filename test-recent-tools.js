#!/usr/bin/env node

/**
 * Test script - Sets a few tools to recent dates to test Recently Added carousel
 */

const fs = require('fs');
const path = require('path');

const AI_TOOLS_FILE = path.join(__dirname, 'ai-tools.json');

console.log('🧪 Testing Recently Added carousel...\n');

const tools = JSON.parse(fs.readFileSync(AI_TOOLS_FILE, 'utf-8'));
console.log(`📚 Loaded ${tools.length} tools\n`);

// Set the first 5 tools to have recent dates
const now = new Date();
const recentDates = [
    new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
    new Date(now.getTime() - 10 * 60 * 60 * 1000), // 10 hours ago
    new Date(now.getTime() - 15 * 60 * 60 * 1000), // 15 hours ago
    new Date(now.getTime() - 20 * 60 * 60 * 1000), // 20 hours ago
];

console.log('Setting 5 tools to recent dates for testing:\n');

for (let i = 0; i < 5 && i < tools.length; i++) {
    tools[i].dateAdded = recentDates[i].toISOString();
    console.log(`✅ ${tools[i].name} - ${Math.floor((now - recentDates[i]) / 1000 / 60 / 60)} hours ago`);
}

fs.writeFileSync(AI_TOOLS_FILE, JSON.stringify(tools, null, 4), 'utf-8');

console.log(`\n💾 Saved changes`);
console.log(`\n🎯 Now refresh your browser to see the "Recently Added" carousel!\n`);
