import time
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify, request

app = Flask(__name__, template_folder='templates', static_folder='static')

FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'

# Simple in-memory cache
cache = {
    'data': None,
    'last_updated': 0
}
CACHE_DURATION = 300  # 5 minutes

def parse_summary_to_updates(entry_title, entry_link, summary_html):
    soup = BeautifulSoup(summary_html, 'html.parser')
    updates = []
    
    headings = soup.find_all(['h3', 'h4'])
    if not headings:
        text = soup.get_text(separator=' ').strip()
        cleaned_text = " ".join(text.split())
        updates.append({
            'date': entry_title,
            'type': 'Update',
            'html': summary_html,
            'text': cleaned_text,
            'link': entry_link
        })
        return updates
        
    for heading in headings:
        update_type = heading.get_text().strip()
        
        # Collect siblings until the next heading
        sibling = heading.next_sibling
        content_parts = []
        while sibling and sibling.name not in ['h3', 'h4']:
            content_parts.append(str(sibling))
            sibling = sibling.next_sibling
            
        update_html = "".join(content_parts).strip()
        
        # Plain text
        sibling_soup = BeautifulSoup(update_html, 'html.parser')
        update_text = sibling_soup.get_text(separator=' ').strip()
        cleaned_text = " ".join(update_text.split())
        
        updates.append({
            'date': entry_title,
            'type': update_type,
            'html': f"<h3>{update_type}</h3>" + update_html,
            'text': cleaned_text,
            'link': entry_link
        })
        
    return updates

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        
        feed = feedparser.parse(response.content)
        
        all_updates = []
        for entry in feed.entries:
            entry_updates = parse_summary_to_updates(
                entry.get('title', 'Unknown Date'),
                entry.get('link', ''),
                entry.get('summary', '')
            )
            all_updates.extend(entry_updates)
            
        return all_updates, None
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    current_time = time.time()
    
    if force_refresh or cache['data'] is None or (current_time - cache['last_updated'] > CACHE_DURATION):
        data, error = fetch_and_parse_feed()
        if error:
            return jsonify({'success': False, 'error': error}), 500
        
        cache['data'] = data
        cache['last_updated'] = current_time
        
    return jsonify({
        'success': True,
        'last_updated': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(cache['last_updated'])),
        'updates': cache['data']
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8080)
