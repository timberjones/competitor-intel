/**
 * Competitor Profiles - Live scraping and summarization
 *
 * Fetches current competitor info and generates AI summaries
 */

/**
 * Get fresh competitor profiles for email digest
 * @returns {Array} Array of profile objects
 */
function getCompetitorProfiles() {
  const profiles = [];

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

  for (const competitor of competitors) {
    try {
      const profile = fetchCompetitorProfile(competitor);
      if (profile) {
        profiles.push(profile);
      }
    } catch (error) {
      Logger.log(`Error fetching profile for ${competitor.name}: ${error.message}`);
      // Add basic profile even if fetch fails
      profiles.push({
        name: competitor.name,
        category: competitor.category,
        summary: 'Profile temporarily unavailable.',
        url: competitor.url
      });
    }
  }

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
 * Extract text from HTML (basic stripping)
 */
function extractTextFromHtml(html) {
  // Remove scripts, styles, and tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Limit to first 3000 characters to stay within Gemini limits
  if (text.length > 3000) {
    text = text.substring(0, 3000) + '...';
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

Provide a concise 2-3 sentence summary covering:
1. What the company does
2. Their key value proposition or differentiator
3. Target market/customers

Keep it factual and focused on business model and offerings.`;

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 200
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
 * Test function - generate profiles manually
 */
function testCompetitorProfiles() {
  const profiles = getCompetitorProfiles();

  Logger.log('=== Competitor Profiles ===');
  profiles.forEach(profile => {
    Logger.log(`\n${profile.name} (${profile.category})`);
    Logger.log(profile.summary);
    Logger.log(`URL: ${profile.url}`);
  });

  return profiles;
}
