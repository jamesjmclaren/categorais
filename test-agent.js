#!/usr/bin/env node

/**
 * Test script for AI Discovery Agent
 * Validates the module can be loaded and functions exist
 */

const agent = require('./ai-discovery-agent.js');

console.log('🧪 Testing AI Discovery Agent...\n');

// Test 1: Check exports
console.log('✓ Module loaded successfully');

if (typeof agent.loadExistingTools === 'function') {
    console.log('✓ loadExistingTools function exists');
} else {
    console.error('✗ loadExistingTools function missing');
    process.exit(1);
}

if (typeof agent.saveTools === 'function') {
    console.log('✓ saveTools function exists');
} else {
    console.error('✗ saveTools function missing');
    process.exit(1);
}

// Test 2: Load existing tools
console.log('\n📚 Loading existing tools...');
try {
    const tools = agent.loadExistingTools();
    console.log(`✓ Loaded ${tools.length} existing tools`);

    if (tools.length > 0) {
        const sample = tools[0];
        console.log('\nSample tool structure:');
        console.log(`  - name: ${sample.name}`);
        console.log(`  - category: ${sample.category}`);
        console.log(`  - pricing: ${sample.pricing}`);
        console.log(`  - features: ${sample.features.length} items`);
    }
} catch (error) {
    console.error('✗ Error loading tools:', error.message);
    process.exit(1);
}

console.log('\n✅ All tests passed! The agent is ready to use.');
console.log('\nTo run the discovery agent, you need to:');
console.log('1. Set BRAVE_API_KEY environment variable');
console.log('2. Set GROQ_API_KEY environment variable');
console.log('3. Run: npm run discover');
