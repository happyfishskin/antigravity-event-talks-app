# BigQuery Release Pulse ⚡

A modern, responsive Python Flask web application designed to fetch, parse, search, and tweet Google Cloud BigQuery release notes in real time.
建構於 Google「5天 AI Agents 密集 Vibe Coding 課程」的第二日實戰項目
## Features

- **Automated RSS Feed Synchronization**: Automatically fetches and parses Google Cloud docs feed from `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`.
- **In-Memory Caching**: Implements a 5-minute memory cache on the Flask server to prevent API throttling and improve response latency.
- **Forced Updates**: A manual **Refresh** button in the header triggers a rotating spinner animation and bypasses the cache to fetch the latest feed.
- **Granular Update Partitioning**: Uses `BeautifulSoup` to dissect daily aggregated summaries into individual, specific feature/issue updates.
- **Real-time Filters & Search**: Offers category pills (`Feature`, `Announcement`, `Changed`, `Issue`, `Deprecated`) and instant client-side full-text search.
- **Draft Tweet Composer**: Automatically drafts tweets showing update status, category, date, and direct release anchor link.
- **Interactive Text Selection**: Highlights and selects text within the release details page to auto-update the tweet draft composer.

## Technology Stack

- **Backend**: Python 3.10+, Flask, `feedparser`, `beautifulsoup4`
- **Frontend**: Plain HTML5, Vanilla JavaScript (ES6), and Custom CSS3 (with Outfit & Inter Google Fonts)

---

## Installation & Running

1. **Clone the repository**:
   ```bash
   git clone https://github.com/happyfishskin/antigravity-event-talks-app.git
   cd antigravity-event-talks-app
   ```

2. **Install dependencies**:
   ```bash
   pip install Flask requests feedparser beautifulsoup4
   ```

3. **Start the development server**:
   ```bash
   python app.py
   ```

4. **Open in browser**:
   Navigate to [http://127.0.0.1:8080/](http://127.0.0.1:8080/) in your web browser.

---

## File Structure

- `app.py` — Flask server, route controllers, feed downloader, and HTML tag analyzer.
- `templates/index.html` — Layout template, search input, filter list, detail container, and tweet composer.
- `static/css/style.css` — Custom glassmorphism styling, layout alignments, animations, and Twitter simulator.
- `static/js/main.js` — Client side routing, rendering, live word-count checker, selection handler, and redirect intents.
- `.gitignore` — Specifies files untracked by Git.
