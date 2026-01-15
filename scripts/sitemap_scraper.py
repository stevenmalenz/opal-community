#!/usr/bin/env python3
"""
Sitemap Scraper for Enablement Copilot
Scrapes all pages from a sitemap.xml and saves to Supabase
"""

import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from supabase import create_client, Client
from urllib.parse import urlparse
import os
import time
from typing import List, Dict

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Use service key for backend

def get_sitemap_urls(sitemap_url: str) -> List[str]:
    """Extract all URLs from a sitemap.xml"""
    print(f"📥 Fetching sitemap from: {sitemap_url}")
    
    try:
        response = requests.get(sitemap_url, timeout=10)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        # Handle both regular sitemaps and sitemap indexes
        urls = []
        
        # Try standard sitemap format
        for url in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}url'):
            loc = url.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
            if loc is not None:
                urls.append(loc.text)
        
        # If no URLs found, try sitemap index format
        if not urls:
            for sitemap in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}sitemap'):
                loc = sitemap.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
                if loc is not None:
                    # Recursively get URLs from nested sitemaps
                    nested_urls = get_sitemap_urls(loc.text)
                    urls.extend(nested_urls)
        
        print(f"✅ Found {len(urls)} URLs in sitemap")
        return urls
        
    except Exception as e:
        print(f"❌ Error fetching sitemap: {e}")
        return []

def scrape_page(url: str) -> Dict[str, str]:
    """Scrape content from a single page"""
    try:
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer"]):
            script.decompose()
        
        # Get title
        title = soup.find('title')
        title_text = title.get_text().strip() if title else urlparse(url).path
        
        # Get main content
        # Try to find main content area (common patterns)
        main_content = (
            soup.find('main') or 
            soup.find('article') or 
            soup.find(class_='content') or
            soup.find(id='content') or
            soup.body
        )
        
        if main_content:
            text = main_content.get_text(' ', strip=True)
        else:
            text = soup.get_text(' ', strip=True)
        
        # Clean up text
        text = ' '.join(text.split())  # Remove extra whitespace
        
        return {
            'title': title_text,
            'content': text[:50000],  # Limit to 50k chars
            'url': url
        }
        
    except Exception as e:
        print(f"⚠️  Error scraping {url}: {e}")
        return None

def save_to_supabase(supabase: Client, org_id: str, scraped_data: List[Dict]):
    """Save scraped content to Supabase"""
    print(f"\n💾 Saving {len(scraped_data)} pages to Supabase...")
    
    for data in scraped_data:
        try:
            supabase.table('content').insert({
                'org_id': org_id,
                'title': data['title'],
                'url': data['url'],
                'content_type': 'webpage',
                'raw_content': data['content'],
                'metadata': {
                    'source': 'sitemap_scraper',
                    'scrape_type': 'full_sitemap',
                    'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S')
                }
            }).execute()
            print(f"  ✅ Saved: {data['title']}")
        except Exception as e:
            print(f"  ❌ Error saving {data['url']}: {e}")

def main(sitemap_url: str, org_id: str):
    """Main scraping workflow"""
    print("🚀 Starting sitemap scraper...")
    print(f"   Organization ID: {org_id}")
    print(f"   Sitemap URL: {sitemap_url}\n")
    
    # Initialize Supabase
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables required")
        print("   Set them in your .env file or export them:")
        print("   export SUPABASE_URL='your-url'")
        print("   export SUPABASE_SERVICE_KEY='your-service-key'")
        return
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get URLs from sitemap
    urls = get_sitemap_urls(sitemap_url)
    
    if not urls:
        print("❌ No URLs found in sitemap")
        return
    
    # Scrape each page
    print(f"\n🕷️  Scraping {len(urls)} pages...")
    scraped_data = []
    
    for i, url in enumerate(urls[:50], 1):  # Limit to 50 pages for demo
        print(f"  [{i}/{min(len(urls), 50)}] Scraping: {url}")
        data = scrape_page(url)
        if data:
            scraped_data.append(data)
        time.sleep(0.5)  # Be nice to the server
    
    # Save to Supabase
    if scraped_data:
        save_to_supabase(supabase, org_id, scraped_data)
        print(f"\n✅ Done! Scraped and saved {len(scraped_data)} pages")
    else:
        print("\n❌ No content was successfully scraped")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 3:
        print("Usage: python sitemap_scraper.py <sitemap_url> <org_id>")
        print("\nExample:")
        print("  python sitemap_scraper.py https://docs.airops.com/sitemap.xml 123e4567-e89b-12d3-a456-426614174000")
        sys.exit(1)
    
    sitemap_url = sys.argv[1]
    org_id = sys.argv[2]
    
    main(sitemap_url, org_id)
