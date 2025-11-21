// State
let allTools = [];
let currentCategory = 'all';
let searchQuery = '';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const toolsContainer = document.getElementById('toolsContainer');
const emptyState = document.getElementById('emptyState');
const header = document.getElementById('header');
const categoryChips = document.querySelectorAll('.category-chip');
const toolModal = document.getElementById('toolModal');
const infoModal = document.getElementById('infoModal');
const aiSearchInput = document.getElementById('aiSearchInput');
const aiSearchBtn = document.getElementById('aiSearchBtn');
const aiSearchResults = document.getElementById('aiSearchResults');

// Load tools
async function loadTools() {
    try {
        const response = await fetch('ai-tools.json');
        if (!response.ok) throw new Error('Failed to load tools');
        allTools = await response.json();
        
        // Update tool count
        document.getElementById('toolCount').textContent = `${allTools.length}+`;
        
        renderTools();
    } catch (error) {
        console.error('Error loading tools:', error);
        toolsContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);">
                <p>Failed to load AI tools. Please refresh the page.</p>
            </div>
        `;
    }
}

// Filter tools
function filterTools() {
    return allTools.filter(tool => {
        const matchesCategory = currentCategory === 'all' || tool.category === currentCategory;
        const matchesSearch = !searchQuery || 
            tool.name.toLowerCase().includes(searchQuery) ||
            tool.description.toLowerCase().includes(searchQuery) ||
            tool.category.toLowerCase().includes(searchQuery) ||
            tool.features.some(f => f.toLowerCase().includes(searchQuery));
        return matchesCategory && matchesSearch;
    });
}

// Auto-generate category display name
function getCategoryDisplayName(category) {
    const customNames = {
        chat: 'Chat & AI Assistants',
        image: 'AI Image Generation',
        video: 'AI Video Creation',
        audio: 'AI Audio & Music',
        code: 'AI Code & Development',
        writing: 'AI Writing & Content',
        productivity: 'AI Productivity',
        research: 'AI Research',
        design: 'AI Design',
        dating: 'AI Dating',
        health: 'AI Health',
        education: 'AI Education',
        gaming: 'AI Gaming',
        finance: 'AI Finance',
        travel: 'AI Travel',
        'customer-service': 'AI Customer Service',
        directory: 'AI Directories',
        enterprise: 'Enterprise AI'
    };

    // Return custom name if exists, otherwise auto-generate
    if (customNames[category]) {
        return customNames[category];
    }

    // Auto-generate: "some-category" -> "AI Some Category"
    return 'AI ' + category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Get recently added tools (last 24 hours)
function getRecentlyAddedTools() {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    return allTools.filter(tool => {
        if (!tool.dateAdded) return false;
        const toolDate = new Date(tool.dateAdded);
        return toolDate >= oneDayAgo;
    });
}

// Render tools
function renderTools() {
    const filtered = filterTools();

    if (filtered.length === 0) {
        toolsContainer.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Render rows
    let html = '';

    // Add "Recently Added" row at the top if there are new tools
    const recentTools = getRecentlyAddedTools();
    if (recentTools.length > 0) {
        html += `
            <div class="tool-row recently-added">
                <div class="row-header">
                    <h2 class="row-title">🆕 Recently Added (Last 24 Hours)</h2>
                    <div class="row-nav">
                        <button class="nav-btn" onclick="scrollRow('row-recent', -300)" aria-label="Scroll left">‹</button>
                        <button class="nav-btn" onclick="scrollRow('row-recent', 300)" aria-label="Scroll right">›</button>
                    </div>
                </div>
                <div class="tool-scroll" id="row-recent">
                    ${recentTools.map(tool => createToolCard(tool)).join('')}
                </div>
            </div>
        `;
    }

    // Group by category
    const grouped = {};
    filtered.forEach(tool => {
        if (!grouped[tool.category]) grouped[tool.category] = [];
        grouped[tool.category].push(tool);
    });

    // Render category rows
    Object.entries(grouped).forEach(([category, tools]) => {
        const rowId = `row-${category}`;
        html += `
            <div class="tool-row">
                <div class="row-header">
                    <h2 class="row-title">${getCategoryDisplayName(category)}</h2>
                    <div class="row-nav">
                        <button class="nav-btn" onclick="scrollRow('${rowId}', -300)" aria-label="Scroll left">‹</button>
                        <button class="nav-btn" onclick="scrollRow('${rowId}', 300)" aria-label="Scroll right">›</button>
                    </div>
                </div>
                <div class="tool-scroll" id="${rowId}">
                    ${tools.map(tool => createToolCard(tool)).join('')}
                </div>
            </div>
        `;
    });

    toolsContainer.innerHTML = html;
    
    // FORCE CORRECT LAYOUT
    setTimeout(() => {
        document.querySelectorAll('.tool-scroll').forEach(scroll => {
            scroll.style.display = 'flex';
            scroll.style.flexDirection = 'row';
            scroll.style.flexWrap = 'nowrap';
            scroll.style.alignItems = 'flex-start';
        });
        
        document.querySelectorAll('.tool-card').forEach(card => {
            card.style.width = '280px';
            card.style.minWidth = '280px';
            card.style.maxWidth = '280px';
            card.style.height = '340px';
            card.style.minHeight = '340px';
            card.style.flex = '0 0 280px';
        });
    }, 50);
    
    // Add click handlers
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const toolName = card.dataset.tool;
            const tool = allTools.find(t => t.name === toolName);
            if (tool) showToolModal(tool);
        });
    });
}

// Create tool card
function createToolCard(tool) {
    const badgeClass = `badge-${tool.pricing}`;
    const sponsoredBadge = tool.sponsored ? '<span class="sponsored-badge">⭐ Featured</span>' : '';
    return `
        <article class="tool-card ${tool.sponsored ? 'sponsored' : ''}" data-tool="${tool.name}">
            <div class="card-image">
                <div class="card-logo">
                    <img src="${tool.logo}" 
                         alt="${tool.name} logo"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='${tool.icon}';">
                </div>
                <span class="card-badge ${badgeClass}">${tool.pricing}</span>
                ${sponsoredBadge}
            </div>
            <div class="card-content">
                <h3 class="card-title">${tool.name}</h3>
                <p class="card-desc">${tool.description}</p>
                <div class="card-tags">
                    ${tool.features.slice(0, 3).map(f => `<span class="tag">${f}</span>`).join('')}
                </div>
            </div>
        </article>
    `;
}

// Scroll row
function scrollRow(rowId, amount) {
    const row = document.getElementById(rowId);
    if (row) {
        row.scrollBy({ left: amount, behavior: 'smooth' });
    }
}

// Show tool modal
function showToolModal(tool) {
    const content = `
        <div class="modal-header">
            <div class="modal-logo">
                <img src="${tool.logo}" 
                     alt="${tool.name} logo"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='${tool.icon}';">
            </div>
            <h2 class="modal-title">${tool.name}</h2>
            <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="modal-url">${tool.url}</a>
        </div>
        <div class="modal-body">
            <p>${tool.description}</p>
        </div>
        <div class="modal-features">
            <h3>Key Features</h3>
            <div class="card-tags">
                ${tool.features.map(f => `<span class="tag">${f}</span>`).join('')}
            </div>
        </div>
        <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="modal-cta">
            Visit ${tool.name} →
        </a>
    `;
    
    document.getElementById('modalContent').innerHTML = content;
    toolModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    toolModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Show info modal
function showInfo(type) {
    const content = {
        about: `
            <h2 style="margin-bottom: 20px;">About CategorAIs</h2>
            <p style="color: rgba(255,255,255,0.7); line-height: 1.8; margin-bottom: 16px;">
                Welcome to CategorAIs, your comprehensive directory for discovering the best AI tools in 2025.
            </p>
            <p style="color: rgba(255,255,255,0.7); line-height: 1.8;">
                We curate and organize the most powerful AI tools across multiple categories to help you find 
                exactly what you need for your projects.
            </p>
        `,
        contact: `
            <h2 style="margin-bottom: 20px;">Contact Us</h2>
            <p style="color: rgba(255,255,255,0.7); line-height: 1.8;">
                Have questions or suggestions? We'd love to hear from you!
            </p>
        `,
        privacy: `
            <h2 style="margin-bottom: 20px;">Privacy Policy</h2>
            <p style="color: rgba(255,255,255,0.7); line-height: 1.8; margin-bottom: 16px;">
                We collect minimal information to improve our service. We do not sell your data.
            </p>
        `,
        terms: `
            <h2 style="margin-bottom: 20px;">Terms of Service</h2>
            <p style="color: rgba(255,255,255,0.7); line-height: 1.8;">
                By using CategorAIs, you agree to use this service responsibly and in accordance with applicable laws.
            </p>
        `
    };
    
    document.getElementById('infoContent').innerHTML = content[type] || '';
    infoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close info modal
function closeInfoModal() {
    infoModal.classList.remove('active');
    document.body.style.overflow = '';
}

// AI Search functionality
async function handleAISearch() {
    const query = aiSearchInput.value.trim();
    
    if (!query) {
        aiSearchResults.innerHTML = `
            <div class="ai-response" style="color: #fbbf24;">
                💡 Try asking something like: "I need to create videos" or "Best free chatbot"
            </div>
        `;
        aiSearchResults.style.display = 'block';
        return;
    }
    
    // Show loading state
    aiSearchBtn.classList.add('loading');
    aiSearchBtn.disabled = true;
    const originalHTML = aiSearchBtn.innerHTML;
    aiSearchBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
        Thinking...
    `;
    
    try {
        // Use local AI matching (no API needed!)
        const recommendations = await getLocalAIRecommendations(query);
        displayAIResults(query, recommendations);
    } catch (error) {
        console.error('AI search error:', error);
        aiSearchResults.innerHTML = `
            <div class="ai-response" style="color: #ff6b6b;">
                ❌ Sorry, something went wrong. Please try again!
            </div>
        `;
        aiSearchResults.style.display = 'block';
    } finally {
        // Reset button
        aiSearchBtn.classList.remove('loading');
        aiSearchBtn.disabled = false;
        aiSearchBtn.innerHTML = originalHTML;
    }
}

// Local AI matching (smart keyword-based recommendations)
async function getLocalAIRecommendations(query) {
    const lowerQuery = query.toLowerCase();
    
    // Simulate thinking delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Smart keyword matching
    const keywords = {
        // Use cases
        'video': ['video', 'film', 'movie', 'recording', 'screen capture', 'presentation'],
        'image': ['image', 'photo', 'picture', 'art', 'draw', 'illustrate', 'design graphic'],
        'chat': ['chat', 'conversation', 'talk', 'assistant', 'chatbot', 'answer questions'],
        'code': ['code', 'programming', 'developer', 'script', 'software', 'debug', 'github'],
        'writing': ['write', 'blog', 'article', 'content', 'copy', 'essay', 'email'],
        'audio': ['audio', 'voice', 'music', 'sound', 'podcast', 'speech'],
        'productivity': ['productivity', 'organize', 'schedule', 'task', 'meeting', 'calendar'],
        'research': ['research', 'paper', 'study', 'academic', 'analyze'],
        'design': ['design', 'ui', 'ux', 'website', 'prototype', 'mockup'],
        
        // Specific tasks
        'presentation': ['presentation', 'slides', 'powerpoint', 'deck'],
        'transcription': ['transcribe', 'transcript', 'speech to text'],
        'translation': ['translate', 'language'],
        'summarize': ['summarize', 'summary', 'tldr'],
        'edit': ['edit', 'enhance', 'improve', 'rewrite'],
    };
    
    // Find matching categories
    let matchedCategories = new Set();
    let matchedTools = [];
    
    // Check each keyword category
    for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => lowerQuery.includes(word))) {
            matchedCategories.add(category);
        }
    }
    
    // If no direct match, do fuzzy search on tool descriptions
    if (matchedCategories.size === 0) {
        matchedTools = allTools.filter(tool => 
            tool.name.toLowerCase().includes(lowerQuery) ||
            tool.description.toLowerCase().includes(lowerQuery) ||
            tool.features.some(f => f.toLowerCase().includes(lowerQuery))
        ).slice(0, 6);
    } else {
        // Get tools from matched categories
        matchedCategories.forEach(cat => {
            const categoryTools = allTools.filter(tool => 
                tool.category === cat ||
                tool.name.toLowerCase().includes(cat) ||
                tool.description.toLowerCase().includes(cat)
            );
            matchedTools.push(...categoryTools);
        });
        
        // Remove duplicates and limit
        matchedTools = [...new Map(matchedTools.map(t => [t.name, t])).values()].slice(0, 6);
    }
    
    // Prioritize free/freemium tools
    matchedTools.sort((a, b) => {
        if (a.pricing === 'free') return -1;
        if (b.pricing === 'free') return 1;
        if (a.pricing === 'freemium') return -1;
        if (b.pricing === 'freemium') return 1;
        return 0;
    });
    
    return matchedTools;
}

// Display AI results
function displayAIResults(query, recommendations) {
    if (recommendations.length === 0) {
        aiSearchResults.innerHTML = `
            <div class="ai-response">
                🤔 I couldn't find any tools matching "<strong>${query}</strong>". 
                <br><br>
                Try being more specific or browse our categories below!
            </div>
        `;
    } else {
        const responseText = generateResponseText(query, recommendations);
        aiSearchResults.innerHTML = `
            <div class="ai-response">
                ✨ ${responseText}
            </div>
            <div class="ai-recommendations">
                ${recommendations.map(tool => `
                    <div class="ai-tool-card" onclick="event.stopPropagation(); showToolModal(allTools.find(t => t.name === '${tool.name.replace(/'/g, "\\'")}'))">
                        <div class="ai-tool-name">${tool.name}</div>
                        <div class="ai-tool-reason">
                            <span style="display: inline-block; padding: 3px 8px; background: rgba(102, 126, 234, 0.2); border-radius: 10px; font-size: 11px; margin-right: 6px;">${tool.pricing}</span>
                            ${tool.category}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    aiSearchResults.style.display = 'block';
    
    // Smooth scroll to results
    setTimeout(() => {
        aiSearchResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Generate natural response text
function generateResponseText(query, tools) {
    const freeCount = tools.filter(t => t.pricing === 'free').length;
    const categories = [...new Set(tools.map(t => t.category))];
    
    const responses = [
        `Based on "${query}", I found ${tools.length} great tools for you${freeCount > 0 ? ` (${freeCount} free!)` : ''}:`,
        `Here are ${tools.length} excellent tools that match your needs:`,
        `Perfect! I found ${tools.length} tools that can help with that:`,
        `Great question! Here are ${tools.length} recommendations:`,
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// Event listeners
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderTools();
});

categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
        categoryChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentCategory = chip.dataset.category;
        renderTools();
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeInfoModal();
    }
    if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
});

// AI Search listeners
aiSearchBtn.addEventListener('click', handleAISearch);

aiSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleAISearch();
    }
});

// Close AI results when clicking outside
document.addEventListener('click', (e) => {
    if (!aiSearchResults.contains(e.target) && 
        !aiSearchInput.contains(e.target) && 
        !aiSearchBtn.contains(e.target)) {
        // Don't close immediately, let user see results
    }
});

// Show submit form modal
function showSubmitForm() {
    const submitModal = document.getElementById('submitModal');
    submitModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close submit form modal
function closeSubmitModal() {
    const submitModal = document.getElementById('submitModal');
    submitModal.classList.remove('active');
    document.body.style.overflow = '';
    // Reset form
    document.getElementById('submitToolForm').reset();
}

// Handle tool submission
async function handleToolSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const originalHTML = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
        Sending...
    `;
    
    // Get form data
    const formData = new FormData(event.target);
    
    // Auto-fix URL if missing protocol
    let url = formData.get('toolUrl').trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    const toolData = {
        name: formData.get('toolName'),
        url: url,
        category: formData.get('toolCategory'),
        description: formData.get('toolDescription'),
        pricing: formData.get('toolPricing'),
        features: formData.get('toolFeatures')?.split('\n').filter(f => f.trim()) || [],
        submitterEmail: formData.get('submitterEmail') || 'Not provided'
    };
    
    try {
        // Send email using FormSubmit.co (free service)
        const response = await fetch('https://formsubmit.co/ajax/jamesjmclaren@gmail.com', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                _subject: `New AI Tool Submission: ${toolData.name}`,
                _template: 'table',
                'Tool Name': toolData.name,
                'Website URL': toolData.url,
                'Category': toolData.category,
                'Description': toolData.description,
                'Pricing': toolData.pricing,
                'Features': toolData.features.join(', '),
                'Submitter Email': toolData.submitterEmail
            })
        });
        
        if (response.ok) {
            // Show success message
            document.getElementById('submitContent').innerHTML = `
                <div class="success-message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <h2 style="color: #22c55e; margin-bottom: 12px;">Thank You!</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 24px;">
                        Your tool submission has been received. We'll review it and add it to the directory soon!
                    </p>
                    <button onclick="closeSubmitModal()" class="submit-btn">
                        Close
                    </button>
                </div>
            `;
        } else {
            throw new Error('Submission failed');
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('Sorry, there was an error submitting your tool. Please try again or email us directly at jamesjmclaren@gmail.com');
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = originalHTML;
    }
}

// Initialize
loadTools();

// NUCLEAR LAYOUT FIX - Force correct layout after render
function enforceLayout() {
    document.querySelectorAll('.tool-scroll').forEach(scroll => {
        scroll.style.display = 'flex';
        scroll.style.flexDirection = 'row';
        scroll.style.flexWrap = 'nowrap';
        scroll.style.alignItems = 'flex-start';
    });
    
    document.querySelectorAll('.tool-card').forEach(card => {
        card.style.width = '280px';
        card.style.minWidth = '280px';
        card.style.maxWidth = '280px';
        card.style.flex = '0 0 280px';
        card.style.flexShrink = '0';
        card.style.flexGrow = '0';
    });
}

// Run layout enforcement after DOM updates
window.addEventListener('load', () => {
    enforceLayout();
    setTimeout(enforceLayout, 500);
    setTimeout(enforceLayout, 1000);
});