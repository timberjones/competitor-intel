import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { diffLines } from 'diff';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOTS_DIR = path.join(__dirname, '../../snapshots');

/**
 * Send data to Apps Script webhook
 */
async function sendToWebhook(data) {
  const webhookUrl = process.env.APPS_SCRIPT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('Warning: APPS_SCRIPT_WEBHOOK_URL not set. Data will not be logged to Google Sheets.');
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send to webhook:', error.message);
    return false;
  }
}

/**
 * Extract meaningful text content from HTML
 */
function extractContent(html) {
  const $ = cheerio.load(html);

  // Remove scripts, styles, and navigation
  $('script, style, nav, header, footer, noscript').remove();

  // Extract text and clean it up
  const text = $('body').text()
    .replace(/\s+/g, ' ')
    .trim();

  // Extract all links for feature detection
  const links = [];
  $('a').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (href && text) {
      links.push({ href, text });
    }
  });

  // Extract headings for structure changes
  const headings = [];
  $('h1, h2, h3').each((_, el) => {
    headings.push($(el).text().trim());
  });

  return { text, links, headings };
}

/**
 * Fetch a page with retry logic
 */
async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

/**
 * Load previous snapshot for a page
 */
async function loadSnapshot(competitorId, pageName) {
  const filename = `${competitorId}_${pageName.replace(/\s+/g, '_')}.json`;
  const filepath = path.join(SNAPSHOTS_DIR, filename);

  try {
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save snapshot for a page
 */
async function saveSnapshot(competitorId, pageName, content) {
  const filename = `${competitorId}_${pageName.replace(/\s+/g, '_')}.json`;
  const filepath = path.join(SNAPSHOTS_DIR, filename);

  await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });
  await fs.writeFile(filepath, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...content
  }, null, 2));
}

/**
 * Compare two snapshots and detect changes
 */
function detectChanges(oldSnapshot, newContent) {
  const changes = [];

  if (!oldSnapshot) {
    return [{ type: 'new_snapshot', description: 'Initial snapshot created' }];
  }

  // Check for new headings (potential new features)
  const newHeadings = newContent.headings.filter(h => !oldSnapshot.headings.includes(h));
  if (newHeadings.length > 0) {
    changes.push({
      type: 'new_sections',
      description: `New sections: ${newHeadings.join(', ')}`,
      significance: 'High'
    });
  }

  // Check for removed headings
  const removedHeadings = oldSnapshot.headings.filter(h => !newContent.headings.includes(h));
  if (removedHeadings.length > 0) {
    changes.push({
      type: 'removed_sections',
      description: `Removed sections: ${removedHeadings.join(', ')}`,
      significance: 'Medium'
    });
  }

  // Check for significant text changes
  const diff = diffLines(oldSnapshot.text, newContent.text);
  const addedLines = diff.filter(d => d.added).map(d => d.value).join('');
  const removedLines = diff.filter(d => d.removed).map(d => d.value).join('');

  if (addedLines.length > 100 || removedLines.length > 100) {
    changes.push({
      type: 'content_change',
      description: `Significant content update (${addedLines.length} chars added, ${removedLines.length} chars removed)`,
      oldContent: removedLines.substring(0, 300),
      newContent: addedLines.substring(0, 300),
      significance: addedLines.length > 500 ? 'High' : 'Medium'
    });
  }

  // Check for new links (potential new features/pages)
  const oldLinks = new Set(oldSnapshot.links.map(l => l.href));
  const newLinks = newContent.links.filter(l => !oldLinks.has(l.href));

  const significantNewLinks = newLinks.filter(l =>
    l.text.toLowerCase().includes('feature') ||
    l.text.toLowerCase().includes('new') ||
    l.text.toLowerCase().includes('pricing') ||
    l.text.toLowerCase().includes('product')
  );

  if (significantNewLinks.length > 0) {
    changes.push({
      type: 'new_links',
      description: `New links: ${significantNewLinks.map(l => l.text).join(', ')}`,
      significance: 'Medium'
    });
  }

  return changes;
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getDateString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Main scraping function
 */
async function scrapeCompetitors() {
  const competitorsPath = path.join(__dirname, 'competitors.json');
  const { competitors } = JSON.parse(await fs.readFile(competitorsPath, 'utf-8'));

  const results = [];

  for (const competitor of competitors) {
    console.log(`\n=== Scraping ${competitor.name} ===`);

    for (const page of competitor.pages) {
      console.log(`  Checking ${page.name}: ${page.url}`);

      try {
        const html = await fetchPage(page.url);
        const content = extractContent(html);
        const oldSnapshot = await loadSnapshot(competitor.id, page.name);
        const changes = detectChanges(oldSnapshot, content);

        if (changes.length > 0 && changes[0].type !== 'new_snapshot') {
          console.log(`    Found ${changes.length} change(s)`);

          for (const change of changes) {
            results.push({
              competitor: competitor.name,
              page: page.name,
              ...change
            });

            // Send to webhook (Apps Script)
            await sendToWebhook({
              type: 'website_change',
              date: getDateString(),
              competitor: competitor.name,
              page: page.name,
              changeType: change.type,
              oldContent: change.oldContent || '',
              newContent: change.newContent || change.description,
              significance: change.significance || 'Low'
            });

            // Small delay between webhook calls
            await new Promise(r => setTimeout(r, 500));
          }
        } else {
          console.log(`    No significant changes`);
        }

        // Save new snapshot
        await saveSnapshot(competitor.id, page.name, content);

      } catch (error) {
        console.error(`    Error: ${error.message}`);
        results.push({
          competitor: competitor.name,
          page: page.name,
          type: 'error',
          description: error.message,
          significance: 'Low'
        });
      }

      // Rate limiting between pages
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Output summary
  console.log('\n=== Summary ===');
  console.log(`Total changes detected: ${results.filter(r => r.type !== 'error' && r.type !== 'new_snapshot').length}`);

  // Write results to JSON for GitHub Actions artifact
  await fs.writeFile(
    path.join(__dirname, '../../scrape-results.json'),
    JSON.stringify(results, null, 2)
  );

  return results;
}

// Run if called directly
scrapeCompetitors().catch(console.error);
