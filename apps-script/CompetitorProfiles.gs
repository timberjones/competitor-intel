/**
 * Competitor Profiles - Live scraping and summarization
 *
 * Fetches current competitor info and generates AI summaries
 * Profiles are stored in a sheet tab and read by email digest (for speed)
 */

/**
 * Get competitor profiles from stored data (FAST - for email digest)
 * @returns {Array} Array of profile objects from sheet
 */
function getCompetitorProfiles() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let profilesSheet = ss.getSheetByName('Competitor Profiles');

  // If sheet doesn't exist, create it and populate
  if (!profilesSheet) {
    Logger.log('Competitor Profiles sheet not found, creating and updating...');
    profilesSheet = ss.insertSheet('Competitor Profiles');
    profilesSheet.appendRow(['Competitor', 'Category', 'Summary', 'URL', 'Last Updated']);
    updateCompetitorProfiles(); // Populate initial data
  }

  const data = profilesSheet.getDataRange().getValues();
  const profiles = [];

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // If competitor name exists
      profiles.push({
        name: data[i][0],
        category: data[i][1],
        summary: data[i][2],
        url: data[i][3],
        lastUpdated: data[i][4]
      });
    }
  }

  return profiles;
}

/**
 * Update competitor profiles (SLOW - run separately)
 * Call this manually or on a separate schedule (weekly/bi-weekly)
 */
function updateCompetitorProfiles() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let profilesSheet = ss.getSheetByName('Competitor Profiles');

  // Create sheet if it doesn't exist
  if (!profilesSheet) {
    profilesSheet = ss.insertSheet('Competitor Profiles');
    profilesSheet.appendRow(['Competitor', 'Category', 'Summary', 'URL', 'Last Updated']);
  }

  const profiles = [];
  const timestamp = new Date();

  // Define competitors and their profile pages
  const competitors = [
    {
      name: 'PlantANT',
      url: 'https://www.plantant.com/',
      category: 'B2B Platform'
    },
    {
      name: 'PlantBid',
      url: 'https://hello.plantbid.com/',
      category: 'Auction'
    },
    {
      name: 'SiteOne Landscape Supply',
      url: 'https://www.siteone.com/en/aboutus',
      category: 'Incumbent'
    },
    {
      name: 'LandscapeHub',
      url: 'https://www.landscapehub.com/about',
      category: 'Marketplace'
    }
  ];

  Logger.log('Starting competitor profile updates...');

  for (const competitor of competitors) {
    try {
      Logger.log(`Fetching ${competitor.name}...`);
      const profile = fetchCompetitorProfile(competitor);
      if (profile) {
        profiles.push({
          name: profile.name,
          category: profile.category,
          summary: profile.summary,
          url: profile.url,
          lastUpdated: timestamp
        });
        Logger.log(`✓ ${competitor.name} complete`);
      }
    } catch (error) {
      Logger.log(`✗ Error fetching ${competitor.name}: ${error.message}`);
      // Add basic profile even if fetch fails
      profiles.push({
        name: competitor.name,
        category: competitor.category,
        summary: 'Profile update failed. See logs for details.',
        url: competitor.url,
        lastUpdated: timestamp
      });
    }
  }

  // Clear existing data (except header) and write new profiles
  const lastRow = profilesSheet.getLastRow();
  if (lastRow > 1) {
    profilesSheet.getRange(2, 1, lastRow - 1, 5).clear();
  }

  // Write updated profiles
  profiles.forEach(profile => {
    profilesSheet.appendRow([
      profile.name,
      profile.category,
      profile.summary,
      profile.url,
      profile.lastUpdated
    ]);
  });

  Logger.log(`✓ Competitor profiles updated! (${profiles.length} profiles)`);
  return profiles;
}

/**
 * Fetch and summarize a competitor's profile
 */
function fetchCompetitorProfile(competitor) {
  try {
    // Fetch the page content
    const response = UrlFetchApp.fetch(competitor.url, {
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(`HTTP ${response.getResponseCode()}`);
    }

    const html = response.getContentText();

    // Extract text content (basic HTML stripping)
    const text = extractTextFromHtml(html);

    // Generate AI summary using Gemini
    const summary = generateCompetitorSummary(competitor.name, text);

    return {
      name: competitor.name,
      category: competitor.category,
      summary: summary,
      url: competitor.url
    };

  } catch (error) {
    Logger.log(`Failed to fetch ${competitor.name}: ${error.message}`);
    return null;
  }
}

/**
 * Extract text from HTML (improved extraction)
 */
function extractTextFromHtml(html) {
  // Remove scripts, styles, navigation, and footers
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Preserve paragraph breaks before removing tags
  text = text
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n');

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace while preserving paragraph breaks
  text = text
    .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs -> single space
    .replace(/\n\s+/g, '\n')  // Remove spaces after newlines
    .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
    .trim();

  // Limit to first 6000 characters to get more context
  if (text.length > 6000) {
    text = text.substring(0, 6000) + '...';
  }

  return text;
}

/**
 * Generate AI summary of competitor using Gemini
 */
function generateCompetitorSummary(competitorName, pageContent) {
  const apiKey = CONFIG.GEMINI_API_KEY;

  if (!apiKey) {
    return 'AI summary unavailable (API key not configured).';
  }

  const prompt = `You are analyzing a competitor website for GoMaterials, a B2B landscape supply marketplace.

Competitor: ${competitorName}

Website content:
${pageContent}

Provide a detailed 3-4 sentence summary covering:
1. What the company does and their core business model
2. Their key value proposition or differentiator
3. Target market/customers and geographic reach
4. Notable services, technology, or competitive advantages

Keep it factual and focused on business model and offerings. Provide enough detail for a competitive intelligence digest.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 700
    }
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      Logger.log(`Gemini API error: ${response.getContentText()}`);
      return 'AI summary temporarily unavailable.';
    }

    const data = JSON.parse(response.getContentText());

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text.trim();
    }

    return 'Summary generation failed.';

  } catch (error) {
    Logger.log(`Gemini API error: ${error.message}`);
    return 'AI summary temporarily unavailable.';
  }
}

/**
 * Test function - update and display profiles
 */
function testCompetitorProfiles() {
  Logger.log('Updating competitor profiles (this takes 30-60 seconds)...\n');

  const profiles = updateCompetitorProfiles();

  Logger.log('\n=== Competitor Profiles ===');
  profiles.forEach(profile => {
    Logger.log(`\n${profile.name} (${profile.category})`);
    Logger.log(profile.summary);
    Logger.log(`URL: ${profile.url}`);
    Logger.log(`Updated: ${profile.lastUpdated}`);
  });

  return profiles;
}

/**
 * Test function - read stored profiles (fast)
 */
function testReadStoredProfiles() {
  const profiles = getCompetitorProfiles();

  Logger.log('=== Stored Competitor Profiles ===');
  profiles.forEach(profile => {
    Logger.log(`\n${profile.name} (${profile.category})`);
    Logger.log(profile.summary);
    Logger.log(`Last updated: ${profile.lastUpdated}`);
  });

  return profiles;
}
