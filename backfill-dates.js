#!/usr/bin/env node

/**
 * Backfill script - Adds dateAdded field to existing tools
 * Run once to add dates to tools that don't have them
 */

const fs = require('fs');
const path = require('path');

const AI_TOOLS_FILE = path.join(__dirname, 'ai-tools.json');

console.log('🔄 Backfilling dateAdded field for existing tools...\n');

// Load tools
const tools = JSON.parse(fs.readFileSync(AI_TOOLS_FILE, 'utf-8'));
console.log(`📚 Loaded ${tools.length} tools`);

let updated = 0;
let skipped = 0;

// Set a date 30 days ago for existing tools (so they don't all show as "new")
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

tools.forEach(tool => {
    if (!tool.dateAdded) {
        tool.dateAdded = thirtyDaysAgo.toISOString();
        updated++;
    } else {
        skipped++;
    }
});

console.log(`\n📊 Results:`);
console.log(`   Updated: ${updated} tools`);
console.log(`   Skipped: ${skipped} tools (already have dateAdded)`);

if (updated > 0) {
    // Save
    fs.writeFileSync(AI_TOOLS_FILE, JSON.stringify(tools, null, 4), 'utf-8');
    console.log(`\n✅ Saved changes to ${AI_TOOLS_FILE}`);
    console.log(`\nAll existing tools now have dateAdded: ${thirtyDaysAgo.toISOString()}`);
    console.log('New tools discovered by the agent will have their actual discovery date.\n');
} else {
    console.log(`\nℹ️  No changes needed. All tools already have dateAdded field.\n`);
}
