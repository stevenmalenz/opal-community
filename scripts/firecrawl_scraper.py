#!/usr/bin/env python3
"""
Firecrawl Scraper for Enablement Copilot
Uses Firecrawl to crawl websites and save to Supabase
"""

from firecrawl import Firecrawl
from supabase import create_client, Client
import os
import time
from typing import List, Dict

# Configuration
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def save_to_supabase(supabase: Client, org_id: str, crawl_data: List[Dict]):
    """Save Firecrawl results to Supabase"""
    print(f"\n💾 Saving {len(crawl_data)} pages to Supabase...")
    
    saved_count = 0
    for doc in crawl_data:
        try:
            metadata = doc.get('metadata', {})
            
            supabase.table('content').insert({
                'org_id': org_id,
                'title': metadata.get('title', metadata.get('sourceURL', 'Untitled')),
                'url': metadata.get('sourceURL') or metadata.get('url'),
                'content_type': 'webpage',
                'raw_content': doc.get('markdown', '')[:50000],  # Limit to 50k chars
                'metadata': {
                    'source': 'firecrawl',
                    'scrape_type': 'full_crawl',
                    'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                    'language': metadata.get('language'),
                    'description': metadata.get('description'),
                    'status_code': metadata.get('statusCode')
                }
            }).execute()
            
            saved_count += 1
            print(f"  ✅ [{saved_count}/{len(crawl_data)}] Saved: {metadata.get('title', 'Untitled')}")
            
        except Exception as e:
            print(f"  ❌ Error saving {metadata.get('sourceURL', 'unknown')}: {e}")
    
    print(f"\n✅ Successfully saved {saved_count}/{len(crawl_data)} pages")
    return saved_count

def main(url: str, org_id: str, limit: int = 100):
    """Main scraping workflow using Firecrawl"""
    print("🚀 Starting Firecrawl scraper...")
    print(f"   Organization ID: {org_id}")
    print(f"   Target URL: {url}")
    print(f"   Page Limit: {limit}\n")
    
    # Validate environment variables
    if not FIRECRAWL_API_KEY:
        print("❌ Error: FIRECRAWL_API_KEY environment variable required")
        print("   Get your API key from: https://firecrawl.dev")
        print("   export FIRECRAWL_API_KEY='fc-YOUR-API-KEY'")
        return
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY required")
        return
    
    # Initialize clients
    firecrawl = Firecrawl(api_key=FIRECRAWL_API_KEY)
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Start crawl
    print(f"🕷️  Starting crawl with Firecrawl (limit: {limit} pages)...")
    
    try:
        # Use the crawl method which waits for completion
        crawl_result = firecrawl.crawl(
            url=url,
            limit=limit,
            scrape_options={
                'formats': ['markdown'],
                'onlyMainContent': True,  # Extract only main content
            }
        )
        
        # Check if successful
        if not crawl_result.get('success'):
            print(f"❌ Crawl failed: {crawl_result.get('error', 'Unknown error')}")
            return
        
        data = crawl_result.get('data', [])
        
        if not data:
            print("⚠️  No pages were crawled")
            return
        
        print(f"\n✅ Crawl completed!")
        print(f"   Status: {crawl_result.get('status')}")
        print(f"   Pages crawled: {crawl_result.get('completed', 0)}/{crawl_result.get('total', 0)}")
        print(f"   Credits used: {crawl_result.get('creditsUsed', 0)}")
        
        # Save to Supabase
        saved_count = save_to_supabase(supabase, org_id, data)
        
        print(f"\n🎉 Done! Crawled {len(data)} pages, saved {saved_count} to Supabase")
        
    except Exception as e:
        print(f"❌ Error during crawl: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python firecrawl_scraper.py <url> <org_id> [limit]")
        print("\nExample:")
        print("  python firecrawl_scraper.py https://docs.airops.com abc123-org-id 50")
        print("\nDefault limit is 100 pages")
        sys.exit(1)
    
    url = sys.argv[1]
    org_id = sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    
    main(url, org_id, limit)
