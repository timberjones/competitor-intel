/**
 * News Monitor - Google Alerts RSS Processing
 *
 * Fetches and processes Google Alerts RSS feeds
 */

// Google Alerts RSS feed URLs (you get these when you create alerts)
// Format: https://www.google.com/alerts/feeds/XXXXX/YYYYY
const ALERT_FEEDS = {
  // Add your Google Alerts RSS URLs here after creating them
  // 'SiteOne': 'https://www.google.com/alerts/feeds/XXX/YYY',
  // 'LandscapeHub': 'https://www.google.com/alerts/feeds/XXX/YYY',
  // etc.
};

// Discovery keywords RSS feeds
const DISCOVERY_FEEDS = {
  // 'landscaping_software': 'https://www.google.com/alerts/feeds/XXX/YYY',
};

/**
 * Fetch and process all Google Alerts
 */
function fetchGoogleAlertsNews() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const findingsSheet = ss.getSheetByName('Findings');

  let newItems = 0;

  // Process competitor-specific alerts
  for (const [competitor, feedUrl] of Object.entries(ALERT_FEEDS)) {
    if (!feedUrl) continue;

    try {
      const items = fetchRssFeed(feedUrl);
      for (const item of items) {
        if (isNewItem(findingsSheet, item.link)) {
          findingsSheet.appendRow([
            formatDate(item.pubDate),
            competitor,
            'News',
            item.title,
            cleanDescription(item.description),
            'Medium', // Default significance
            item.link,
            'No'
          ]);
          newItems++;
        }
      }
    } catch (error) {
      Logger.log(`Error fetching ${competitor} alerts: ${error.message}`);
    }
  }

  // Process discovery alerts
  for (const [keyword, feedUrl] of Object.entries(DISCOVERY_FEEDS)) {
    if (!feedUrl) continue;

    try {
      const items = fetchRssFeed(feedUrl);
      for (const item of items) {
        if (isNewItem(findingsSheet, item.link)) {
          findingsSheet.appendRow([
            formatDate(item.pubDate),
            'Discovery',
            'News',
            item.title,
            cleanDescription(item.description),
            'Medium',
            item.link,
            'No'
          ]);
          newItems++;
        }
      }
    } catch (error) {
      Logger.log(`Error fetching ${keyword} alerts: ${error.message}`);
    }
  }

  Logger.log(`Fetched ${newItems} new news items`);
  return newItems;
}

/**
 * Fetch and parse an RSS feed
 */
function fetchRssFeed(feedUrl) {
  const response = UrlFetchApp.fetch(feedUrl);
  const xml = response.getContentText();
  const document = XmlService.parse(xml);
  const root = document.getRootElement();

  const items = [];
  const namespace = XmlService.getNamespace('http://www.w3.org/2005/Atom');

  const entries = root.getChildren('entry', namespace);
  for (const entry of entries) {
    items.push({
      title: entry.getChild('title', namespace)?.getText() || '',
      link: entry.getChild('link', namespace)?.getAttribute('href')?.getValue() || '',
      description: entry.getChild('content', namespace)?.getText() || '',
      pubDate: entry.getChild('published', namespace)?.getText() || new Date().toISOString()
    });
  }

  return items;
}

/**
 * Check if an item already exists (by URL)
 */
function isNewItem(sheet, url) {
  const data = sheet.getDataRange().getValues();
  const urlColumn = 6; // Source URL column (0-indexed)

  for (let i = 1; i < data.length; i++) {
    if (data[i][urlColumn] === url) {
      return false;
    }
  }
  return true;
}

/**
 * Clean HTML from description
 */
function cleanDescription(html) {
  if (!html) return '';

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Truncate if too long
  if (text.length > 500) {
    text = text.substring(0, 497) + '...';
  }

  return text;
}

/**
 * Format date string to YYYY-MM-DD
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return Utilities.formatDate(date, 'UTC', 'yyyy-MM-dd');
  } catch {
    return Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  }
}
