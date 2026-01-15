# Firecrawl Scraper for Enablement Copilot

Automatically crawl and scrape entire websites using [Firecrawl](https://firecrawl.dev) and save to Supabase.

## Why Firecrawl?

✅ **Handles everything:**
- JavaScript rendering
- Bypasses blockers & CAPTCHAs
- Rate limiting
- Clean markdown output
- Recursive crawling with limits

## Setup

### 1. Install Dependencies

```bash
pip install firecrawl-py supabase
```

### 2. Get Your Firecrawl API Key

1. Sign up at [firecrawl.dev](https://firecrawl.dev)
2. Get your API key from the dashboard
3. Set environment variable:

```bash
export FIRECRAWL_API_KEY="fc-YOUR-API-KEY"
```

### 3. Set Supabase Credentials

```bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-key"
```

## Usage

```bash
python scripts/firecrawl_scraper.py <url> <org_id> [limit]
```

### Examples

**Basic crawl (100 pages max):**
```bash
python scripts/firecrawl_scraper.py https://docs.airops.com abc123-org-id
```

**Limit to 50 pages:**
```bash
python scripts/firecrawl_scraper.py https://docs.firecrawl.dev abc123-org-id 50
```

**Large documentation site:**
```bash
python scripts/firecrawl_scraper.py https://docs.example.com abc123-org-id 500
```

## Finding Your Org ID

Run this SQL in Supabase SQL Editor:

```sql
SELECT id, name FROM organizations;
```

## What It Does

1. 🕷️  **Crawls** your entire website using Firecrawl
2. 📝 **Extracts** clean markdown content from each page
3. 💾 **Saves** to Supabase `content` table with metadata
4. ✅ **Reports** progress and success/failure

## Output

The scraper saves each page with:

- **Title** - Page title from metadata
- **URL** - Source URL
- **Content** - Clean markdown (max 50k chars per page)
- **Metadata:**
  - `source: 'firecrawl'`
  - `scrape_type: 'full_crawl'`
  - `scraped_at` - Timestamp
  - `language` - Page language
  - `description` - Meta description
  - `status_code` - HTTP status

## Pricing

Firecrawl charges per page crawled. Check [firecrawl.dev/pricing](https://firecrawl.dev/pricing) for current rates.

## Troubleshooting

**"FIRECRAWL_API_KEY not found"**
- Set the environment variable: `export FIRECRAWL_API_KEY="fc-..."`

**"No pages were crawled"**
- Check if the URL is accessible
- Try increasing the limit
- Check Firecrawl dashboard for errors

**"Error saving to Supabase"**
- Verify your SUPABASE_SERVICE_KEY (not anon key)
- Check that RLS policies allow inserts
- Run the `ULTIMATE_RLS_FIX.sql` if needed

## Alternative: Manual Sitemap Scraper

If you prefer a free, custom solution, see `sitemap_scraper.py` for a BeautifulSoup-based scraper that parses sitemaps directly.
