import feedparser
from bs4 import BeautifulSoup

def parse_summary_to_updates(entry_title, entry_link, summary_html):
    soup = BeautifulSoup(summary_html, 'html.parser')
    updates = []
    
    headings = soup.find_all(['h3', 'h4'])
    if not headings:
        text = soup.get_text(separator=' ').strip()
        updates.append({
            'date': entry_title,
            'type': 'Update',
            'html': summary_html,
            'text': " ".join(text.split()),
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
        update_text = " ".join(update_text.split())
        
        updates.append({
            'date': entry_title,
            'type': update_type,
            'html': f"<h3>{update_type}</h3>" + update_html,
            'text': update_text,
            'link': entry_link
        })
        
    return updates

feed_url = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'
feed = feedparser.parse(feed_url)

if len(feed.entries) > 0:
    for entry in feed.entries[:3]:
        print("Entry Title:", entry.title)
        updates = parse_summary_to_updates(entry.title, entry.link, entry.summary)
        print(f"Found {len(updates)} individual updates:")
        for idx, up in enumerate(updates):
            print(f"  [{idx + 1}] Type: {up['type']}")
            print(f"      Text preview: {up['text'][:120]}...")
            print(f"      Link: {up['link']}")
        print("-" * 40)
