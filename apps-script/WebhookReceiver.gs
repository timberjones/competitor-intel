/**
 * Webhook Receiver - Accepts data from GitHub Actions
 *
 * This script acts as a web app endpoint that receives scraper data
 * and writes it to Google Sheets. No service account needed!
 *
 * Deploy as: Web App
 * Execute as: Me
 * Who has access: Anyone (GitHub Actions will POST here)
 */

/**
 * Handle POST requests from GitHub Actions scraper
 * @param {Object} e - Event object with postData
 * @returns {Object} - JSON response
 */
function doPost(e) {
  try {
    // Parse incoming JSON data
    const data = JSON.parse(e.postData.contents);

    // Validate request has required fields
    if (!data || !data.type) {
      return createResponse(400, 'Invalid request: missing type field');
    }

    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());

    // Route to appropriate handler based on type
    switch (data.type) {
      case 'website_change':
        handleWebsiteChange(ss, data);
        break;
      case 'finding':
        handleFinding(ss, data);
        break;
      case 'job_posting':
        handleJobPosting(ss, data);
        break;
      default:
        return createResponse(400, `Unknown type: ${data.type}`);
    }

    return createResponse(200, 'Data recorded successfully');

  } catch (error) {
    Logger.log('Webhook error: ' + error.message);
    return createResponse(500, 'Error: ' + error.message);
  }
}

/**
 * Handle GET requests (for testing the webhook)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'Competitor Intelligence Webhook is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle website change data
 */
function handleWebsiteChange(ss, data) {
  const sheet = ss.getSheetByName('Website Changes');

  if (!sheet) {
    throw new Error('Website Changes sheet not found');
  }

  sheet.appendRow([
    data.date || formatDate(new Date()),
    data.competitor || 'Unknown',
    data.page || '',
    data.changeType || 'Content Change',
    data.oldContent || '',
    data.newContent || '',
    data.significance || 'Medium'
  ]);

  // Also add to Findings sheet for visibility
  const findingsSheet = ss.getSheetByName('Findings');
  if (findingsSheet) {
    findingsSheet.appendRow([
      data.date || formatDate(new Date()),
      data.competitor || 'Unknown',
      'Website',
      `${data.page} - ${data.changeType}`,
      truncate(data.newContent, 500),
      data.significance || 'Medium',
      '', // No URL
      'No' // Not reviewed
    ]);
  }
}

/**
 * Handle general finding data
 */
function handleFinding(ss, data) {
  const sheet = ss.getSheetByName('Findings');

  if (!sheet) {
    throw new Error('Findings sheet not found');
  }

  sheet.appendRow([
    data.date || formatDate(new Date()),
    data.competitor || 'Unknown',
    data.findingType || 'Discovery',
    data.title || '',
    data.description || '',
    data.significance || 'Medium',
    data.url || '',
    'No' // Not reviewed
  ]);
}

/**
 * Handle job posting data
 */
function handleJobPosting(ss, data) {
  const sheet = ss.getSheetByName('Job Postings');

  if (!sheet) {
    throw new Error('Job Postings sheet not found');
  }

  sheet.appendRow([
    data.date || formatDate(new Date()),
    data.competitor || 'Unknown',
    data.role || '',
    data.department || '',
    data.location || '',
    data.notes || ''
  ]);

  // Also add to Findings
  const findingsSheet = ss.getSheetByName('Findings');
  if (findingsSheet) {
    findingsSheet.appendRow([
      data.date || formatDate(new Date()),
      data.competitor || 'Unknown',
      'Job',
      data.role || 'New Position',
      `${data.department || ''} - ${data.location || ''}`,
      data.significance || 'Medium',
      data.url || '',
      'No'
    ]);
  }
}

/**
 * Create JSON response
 */
function createResponse(statusCode, message) {
  const response = {
    statusCode: statusCode,
    message: message,
    timestamp: new Date().toISOString()
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  return Utilities.formatDate(date, 'UTC', 'yyyy-MM-dd');
}

/**
 * Truncate text to max length
 */
function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Test the webhook locally
 */
function testWebhook() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        type: 'website_change',
        date: '2026-02-06',
        competitor: 'PlantANT',
        page: 'Homepage',
        changeType: 'Content Update',
        oldContent: 'Old text here',
        newContent: 'New text here',
        significance: 'High'
      })
    }
  };

  const response = doPost(testData);
  Logger.log(response.getContent());
}
