
import os
from firecrawl import Firecrawl
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("FIRECRAWL_API_KEY")
if not api_key:
    print("Error: FIRECRAWL_API_KEY not found in .env")
    exit(1)

app = Firecrawl(api_key=api_key)


# Test URL with a video/image (e.g. Stripe docs or similar)
url = "https://docs.stripe.com/payments/checkout"

print(f"Inspecting app object: {dir(app)}")


print(f"Scraping {url}...")
try:
    # Use V2 API signature
    scrape_result = app.scrape(url, formats=['markdown'])
    
    if not scrape_result:
        print("Scrape failed: No result returned")
        exit(1)

    print("\n✅ Scrape Successful!")
    
    # Handle response (might be object or dict)
    if isinstance(scrape_result, dict):
        markdown = scrape_result.get('markdown', '')
        metadata = scrape_result.get('metadata', {})
    else:
        # Assume object
        markdown = getattr(scrape_result, 'markdown', '')
        metadata = getattr(scrape_result, 'metadata', {})
        if not markdown and hasattr(scrape_result, 'data'):
             # fallback for older logic
             data = scrape_result.data
             markdown = data.get('markdown', '')
             metadata = data.get('metadata', {})

    print("\n--- Metadata ---")
    print(metadata)
    
    print(f"\n--- Markdown Content (First 1000 chars) ---")
    print(markdown[:1000])
    
    print("\n--- Media Check ---")
    if '![' in markdown:
        print("✅ Found image tags (![...])")
    else:
        print("⚠️ No image tags found")
        
    if 'youtube.com' in markdown or 'youtu.be' in markdown:
        print("✅ Found YouTube links")
    else:
        print("ℹ️ No YouTube links found in this specific page")
        
    # Save to file for inspection
    with open('test_scrape_output.md', 'w') as f:
        f.write(markdown)
    print("\nFull output saved to test_scrape_output.md")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
