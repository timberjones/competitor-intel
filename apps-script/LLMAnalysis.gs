/**
 * LLM Analysis - Gemini API Integration
 *
 * Uses Google's Gemini API (free tier) for summarization and analysis
 * Free tier: 15 requests/minute, 1M tokens/day
 */

/**
 * Call Gemini API with a prompt
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {string} - The response text
 */
function callGeminiAPI(prompt) {
  const apiKey = CONFIG.GEMINI_API_KEY;

  if (!apiKey) {
    Logger.log('Error: GEMINI_API_KEY not set in Script Properties');
    return 'Error: API key not configured. Please set GEMINI_API_KEY in Script Properties.';
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      Logger.log(`Gemini API error (${responseCode}): ${responseText}`);
      return `Error: API returned status ${responseCode}`;
    }

    const data = JSON.parse(responseText);

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      Logger.log('Unexpected Gemini response structure: ' + responseText);
      return 'Error: Unexpected response structure';
    }
  } catch (error) {
    Logger.log('Gemini API error: ' + error.message);
    return 'Error: ' + error.message;
  }
}

/**
 * Generate weekly summary of all findings
 * @returns {Object} - Summary object with text, insights, and action items
 */
function generateWeeklySummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const findingsSheet = ss.getSheetByName('Findings');
  const websiteSheet = ss.getSheetByName('Website Changes');
  const summariesSheet = ss.getSheetByName('Weekly Summaries');

  // Get findings from the past week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekStart = Utilities.formatDate(oneWeekAgo, 'UTC', 'yyyy-MM-dd');

  const findings = getRecentFindings(findingsSheet, weekStart);
  const websiteChanges = getRecentChanges(websiteSheet, weekStart);

  if (findings.length === 0 && websiteChanges.length === 0) {
    Logger.log('No findings or changes this week');
    return {
      summary: 'No significant competitor activity detected this week.',
      insights: 'N/A',
      actionItems: 'Continue monitoring.'
    };
  }

  // Build prompt for Gemini
  const prompt = buildSummaryPrompt(findings, websiteChanges);

  // Call Gemini API
  const response = callGeminiAPI(prompt);

  // Parse the response
  const result = parseSummaryResponse(response);

  // Log to Weekly Summaries sheet
  const currentWeek = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  summariesSheet.appendRow([
    currentWeek,
    result.summary,
    result.insights,
    result.actionItems
  ]);

  Logger.log('Weekly summary generated and saved');
  return result;
}

/**
 * Get findings from the past week
 */
function getRecentFindings(sheet, startDate) {
  const data = sheet.getDataRange().getValues();
  const findings = [];

  for (let i = 1; i < data.length; i++) {
    const rowDate = data[i][0];
    if (rowDate && rowDate >= startDate) {
      findings.push({
        date: data[i][0],
        competitor: data[i][1],
        type: data[i][2],
        title: data[i][3],
        description: data[i][4],
        significance: data[i][5]
      });
    }
  }

  return findings;
}

/**
 * Get website changes from the past week
 */
function getRecentChanges(sheet, startDate) {
  const data = sheet.getDataRange().getValues();
  const changes = [];

  for (let i = 1; i < data.length; i++) {
    const rowDate = data[i][0];
    if (rowDate && rowDate >= startDate) {
      changes.push({
        date: data[i][0],
        competitor: data[i][1],
        page: data[i][2],
        changeType: data[i][3],
        significance: data[i][6]
      });
    }
  }

  return changes;
}

/**
 * Build the prompt for the LLM
 */
function buildSummaryPrompt(findings, websiteChanges) {
  let prompt = `You are a competitive intelligence analyst for GoMaterials, a B2B marketplace for landscape supplies.
Analyze the following competitor activity from the past week and provide:

1. A brief executive summary (2-3 sentences)
2. Key insights (bullet points)
3. Recommended action items (bullet points)

Focus on strategic implications for GoMaterials. Prioritize high-significance items.

## News & Findings This Week:
`;

  if (findings.length > 0) {
    findings.forEach(f => {
      prompt += `- [${f.significance}] ${f.competitor}: ${f.title}\n  ${f.description}\n`;
    });
  } else {
    prompt += "No news items this week.\n";
  }

  prompt += `\n## Website Changes This Week:\n`;

  if (websiteChanges.length > 0) {
    websiteChanges.forEach(c => {
      prompt += `- [${c.significance}] ${c.competitor} (${c.page}): ${c.changeType}\n`;
    });
  } else {
    prompt += "No website changes detected.\n";
  }

  prompt += `\n## Output Format:
SUMMARY:
[Your 2-3 sentence executive summary here]

INSIGHTS:
- [Insight 1]
- [Insight 2]
- [etc.]

ACTION ITEMS:
- [Action 1]
- [Action 2]
- [etc.]`;

  return prompt;
}

/**
 * Parse the LLM response into structured data
 */
function parseSummaryResponse(response) {
  const result = {
    summary: '',
    insights: '',
    actionItems: ''
  };

  // Check for error
  if (response.startsWith('Error:')) {
    result.summary = response;
    result.insights = 'N/A';
    result.actionItems = 'Check API configuration';
    return result;
  }

  // Parse sections
  const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=INSIGHTS:|$)/i);
  const insightsMatch = response.match(/INSIGHTS:\s*([\s\S]*?)(?=ACTION ITEMS:|$)/i);
  const actionsMatch = response.match(/ACTION ITEMS:\s*([\s\S]*?)$/i);

  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  }

  if (insightsMatch) {
    result.insights = insightsMatch[1].trim();
  }

  if (actionsMatch) {
    result.actionItems = actionsMatch[1].trim();
  }

  // Fallback if parsing failed
  if (!result.summary) {
    result.summary = response.substring(0, 500);
    result.insights = 'See full response';
    result.actionItems = 'Review manually';
  }

  return result;
}

/**
 * Analyze a single finding for significance
 * @param {string} title - The finding title
 * @param {string} description - The finding description
 * @returns {string} - High, Medium, or Low
 */
function analyzeSignificance(title, description) {
  const prompt = `You are a competitive intelligence analyst. Rate the significance of this finding for a B2B landscape supply marketplace company.

Finding: ${title}
Details: ${description}

Rate as exactly one of: High, Medium, or Low

Criteria:
- High: Direct competitive threat, major product launch, significant funding, key hire
- Medium: Industry trend, minor feature update, partnership announcement
- Low: Routine news, minor updates, not directly relevant

Respond with ONLY the word: High, Medium, or Low`;

  const response = callGeminiAPI(prompt);

  // Extract just the significance level
  const normalized = response.trim().toLowerCase();
  if (normalized.includes('high')) return 'High';
  if (normalized.includes('low')) return 'Low';
  return 'Medium'; // Default to medium
}
