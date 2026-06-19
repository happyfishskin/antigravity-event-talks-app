let allReleases = [];
let filteredReleases = [];
let selectedRelease = null;
let activeFilter = 'All';
let searchTerm = '';
let isRefreshing = false;

document.addEventListener('DOMContentLoaded', () => {
  // Bind UI Elements
  const refreshBtn = document.getElementById('refresh-trigger');
  const searchInput = document.getElementById('search-input');
  
  // Set up filter pills listener
  const filterPillsContainer = document.getElementById('filter-pills-container');
  filterPillsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeFilter = pill.dataset.filter;
    applyFilterAndSearch();
  });
  
  // Listeners
  refreshBtn.addEventListener('click', () => fetchReleases(true));
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    applyFilterAndSearch();
  });
  
  // Initial load
  fetchReleases(false);
});

async function fetchReleases(force = false) {
  if (isRefreshing) return;
  isRefreshing = true;
  
  const refreshBtn = document.getElementById('refresh-trigger');
  const staticIcon = document.getElementById('refresh-icon-static');
  const timeInfo = document.getElementById('last-updated-time');
  
  refreshBtn.classList.add('spinning');
  staticIcon.style.display = 'none';
  
  try {
    const url = `/api/releases${force ? '?refresh=true' : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.success) {
      allReleases = data.updates;
      timeInfo.innerText = data.last_updated;
      applyFilterAndSearch();
      
      // Auto select first entry on initial load or reload
      if (filteredReleases.length > 0) {
        // If selectedRelease is already in the list, keep it selected. Otherwise select the first.
        const stillExists = filteredReleases.some(r => r.date === selectedRelease?.date && r.text === selectedRelease?.text);
        if (!stillExists) {
          selectRelease(filteredReleases[0]);
        } else {
          // Re-select to update data in detail panel
          const found = filteredReleases.find(r => r.date === selectedRelease.date && r.text === selectedRelease.text);
          selectRelease(found);
        }
      } else {
        renderPlaceholder();
      }
      
      if (force) {
        showToast('Successfully refreshed BigQuery feed!');
      }
    } else {
      showToast('Error: ' + data.error);
    }
  } catch (err) {
    showToast('Failed to connect to backend server.');
    console.error(err);
  } finally {
    isRefreshing = false;
    refreshBtn.classList.remove('spinning');
    staticIcon.style.display = 'block';
  }
}

function applyFilterAndSearch() {
  filteredReleases = allReleases.filter(release => {
    // 1. Filter by category badge
    const matchesFilter = activeFilter === 'All' || release.type.toLowerCase() === activeFilter.toLowerCase();
    
    // 2. Filter by search input
    const matchesSearch = searchTerm === '' || 
      release.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.date.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesFilter && matchesSearch;
  });
  
  renderReleasesList();
}

function renderReleasesList() {
  const listContainer = document.getElementById('releases-list');
  listContainer.innerHTML = '';
  
  if (filteredReleases.length === 0) {
    listContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; color:var(--text-muted); text-align:center; gap:0.5rem;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>No matching releases found</span>
      </div>
    `;
    return;
  }
  
  filteredReleases.forEach((release) => {
    const card = document.createElement('div');
    const isSelected = selectedRelease && 
      selectedRelease.date === release.date && 
      selectedRelease.text === release.text;
      
    card.className = `update-card ${isSelected ? 'selected' : ''}`;
    
    // Lowercase category for class
    const typeClass = `badge-${release.type.toLowerCase().trim()}`;
    
    card.innerHTML = `
      <div class="card-meta">
        <span class="type-badge ${typeClass}">${release.type}</span>
        <span class="update-date">${release.date}</span>
      </div>
      <div class="card-title-snippet">${release.text}</div>
    `;
    
    card.addEventListener('click', () => {
      // Remove selection from previous
      document.querySelectorAll('.update-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectRelease(release);
    });
    
    listContainer.appendChild(card);
  });
}

function selectRelease(release) {
  selectedRelease = release;
  renderDetailPanel();
}

function renderPlaceholder() {
  const detailPanel = document.getElementById('detail-panel');
  detailPanel.innerHTML = `
    <div class="detail-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      <h3>No Update Selected</h3>
      <p>Click on any release card in the list to view full notes, inspect code additions, and draft a Tweet.</p>
    </div>
  `;
}

function renderDetailPanel() {
  if (!selectedRelease) {
    renderPlaceholder();
    return;
  }
  
  const detailPanel = document.getElementById('detail-panel');
  const typeClass = `badge-${selectedRelease.type.toLowerCase().trim()}`;
  
  // Format initial tweet draft content
  const prefix = `BigQuery [${selectedRelease.type}] (${selectedRelease.date}): `;
  const linkText = ` ${selectedRelease.link}`;
  const availableLength = 280 - prefix.length - linkText.length - 3; // buffer for ellipsis/spacing
  
  let tweetTextDraft = selectedRelease.text;
  if (tweetTextDraft.length > availableLength) {
    tweetTextDraft = tweetTextDraft.substring(0, availableLength) + '...';
  }
  const defaultTweet = `${prefix}${tweetTextDraft}${linkText}`;
  
  detailPanel.innerHTML = `
    <!-- Detail Header -->
    <div class="detail-header">
      <div class="detail-meta">
        <span class="type-badge ${typeClass}">${selectedRelease.type}</span>
        <span class="update-date">${selectedRelease.date}</span>
      </div>
      <h2 class="detail-title">Google BigQuery Release Notes</h2>
    </div>
    
    <!-- Detail Content -->
    <div class="detail-body">
      ${selectedRelease.html}
    </div>
    
    <!-- Tweet Section -->
    <div class="tweet-section">
      <div class="tweet-composer-box">
        <div class="composer-header">
          <span>Draft Tweet Composer</span>
          <span class="char-counter" id="char-counter">0 / 280</span>
        </div>
        <textarea id="tweet-textarea" class="tweet-textarea" placeholder="Compose your tweet...">${defaultTweet}</textarea>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.8rem; color:var(--text-muted);">
          Select text from details above to customize your tweet!
        </span>
        <button id="tweet-btn" class="tweet-btn">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
          </svg>
          Post Tweet
        </button>
      </div>
    </div>
  `;
  
  // Set up composer logic
  const textarea = document.getElementById('tweet-textarea');
  const counter = document.getElementById('char-counter');
  const tweetBtn = document.getElementById('tweet-btn');
  
  const updateCounter = () => {
    const len = textarea.value.length;
    counter.innerText = `${len} / 280`;
    
    if (len > 280) {
      counter.className = 'char-counter danger';
      tweetBtn.disabled = true;
    } else if (len > 240) {
      counter.className = 'char-counter warning';
      tweetBtn.disabled = false;
    } else {
      counter.className = 'char-counter';
      tweetBtn.disabled = false;
    }
  };
  
  textarea.addEventListener('input', updateCounter);
  updateCounter(); // Initial check
  
  // Handle Tweet submission
  tweetBtn.addEventListener('click', () => {
    const text = encodeURIComponent(textarea.value);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    showToast('Redirected to Twitter composer!');
  });
  
  // Support custom selection for Tweet composer
  const detailBody = document.querySelector('.detail-body');
  detailBody.addEventListener('mouseup', () => {
    const selection = window.getSelection().toString().trim();
    if (selection.length > 5 && selection.length < 240) {
      const customPrefix = `BigQuery [${selectedRelease.type}] (${selectedRelease.date}): `;
      const customLink = ` ${selectedRelease.link}`;
      
      const newTweet = `${customPrefix}${selection}${customLink}`;
      if (newTweet.length <= 280) {
        textarea.value = newTweet;
        updateCounter();
        showToast('Tweet draft updated with selected text!');
      }
    }
  });
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2700);
}
