#!/usr/bin/env node

/**
 * Cleanup script - Fixes poor quality descriptions using Groq
 * Identifies and improves incomplete or article-like descriptions
 */

const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_TOOLS_FILE = path.join(__dirname, 'ai-tools.json');

// Patterns that indicate bad descriptions
const BAD_DESCRIPTION_PATTERNS = [
    /^we performed/i,
    /^i tested/i,
    /^this article/i,
    /^in this/i,
    /series of.*sprints/i,
    /\.{3}$/, // Ends with ...
    /.{150,}/, // Too long (over 150 chars)
];

/**
 * Check if description needs fixing
 */
function needsFixing(description) {
    if (!description || description.length < 20) return true;

    return BAD_DESCRIPTION_PATTERNS.some(pattern => pattern.test(description));
}

/**
 * Fix description using Groq
 */
async function fixDescription(tool) {
    try {
        const prompt = `Given this AI tool, write a clear, concise product description (max 120 characters).

Tool: ${tool.name}
URL: ${tool.url}
Category: ${tool.category}
Current Description: ${tool.description}
Features: ${tool.features.join(', ')}

Write a professional product description that:
- Is 1-2 sentences maximum
- Under 120 characters
- Describes what the tool DOES
- Is not an article excerpt
- Doesn't end with "..."

Return ONLY the new description text, nothing else.`;

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
                        content: 'You write concise, clear product descriptions. Return only the description text.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 100
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const newDescription = data.choices[0]?.message?.content?.trim();

        // Remove quotes if Groq added them
        return newDescription.replace(/^["']|["']$/g, '').substring(0, 150);

    } catch (error) {
        console.error(`   Error fixing ${tool.name}:`, error.message);
        return tool.description;
    }
}

/**
 * Main cleanup function
 */
async function cleanupDescriptions() {
    console.log('🔧 Cleaning up tool descriptions...\n');

    if (!GROQ_API_KEY) {
        console.error('❌ Missing GROQ_API_KEY environment variable');
        process.exit(1);
    }

    // Load tools
    const tools = JSON.parse(fs.readFileSync(AI_TOOLS_FILE, 'utf-8'));
    console.log(`📚 Loaded ${tools.length} tools\n`);

    // Find tools that need fixing
    const needsFix = tools.filter(tool => needsFixing(tool.description));
    console.log(`🔍 Found ${needsFix.length} tools with poor descriptions\n`);

    if (needsFix.length === 0) {
        console.log('✅ All descriptions look good!\n');
        return;
    }

    // Show preview
    console.log('📋 Tools to fix:');
    needsFix.slice(0, 10).forEach(tool => {
        const preview = tool.description.substring(0, 60) + '...';
        console.log(`   • ${tool.name}: "${preview}"`);
    });
    if (needsFix.length > 10) {
        console.log(`   ... and ${needsFix.length - 10} more\n`);
    } else {
        console.log('');
    }

    console.log('🤖 Fixing descriptions with Groq AI...\n');

    let fixed = 0;
    for (const tool of needsFix) {
        const shortName = tool.name.length > 30 ? tool.name.substring(0, 27) + '...' : tool.name;
        process.stdout.write(`   [${fixed + 1}/${needsFix.length}] ${shortName.padEnd(33)}`);

        const newDescription = await fixDescription(tool);

        // Update in main array
        const toolIndex = tools.findIndex(t => t.name === tool.name);
        if (toolIndex !== -1) {
            tools[toolIndex].description = newDescription;
            console.log(' ✅');
            fixed++;
        } else {
            console.log(' ❌');
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Fixed ${fixed} descriptions\n`);

    // Save
    fs.writeFileSync(AI_TOOLS_FILE, JSON.stringify(tools, null, 4), 'utf-8');
    console.log(`💾 Saved to ${AI_TOOLS_FILE}\n`);
}

// Run
if (require.main === module) {
    cleanupDescriptions().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { cleanupDescriptions };
