/**
 * Competitor Intelligence - Google Apps Script
 *
 * Main entry point and configuration
 */

// Configuration
const CONFIG = {
  SHEET_ID: PropertiesService.getScriptProperties().getProperty('SHEET_ID') || null, // Optional: for webhook
  GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  // Email recipients (comma-separated in Script Properties)
  DIGEST_RECIPIENTS: (function() {
    const recipientsString = PropertiesService.getScriptProperties().getProperty('DIGEST_RECIPIENTS') || 'your-email@example.com';
    return recipientsString.split(',').map(email => email.trim()).filter(email => email);
  })(),
  DIGEST_DAY: 1, // Monday (0 = Sunday, 1 = Monday, etc.)
};

/**
 * Initialize sheet headers if empty
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Competitors sheet
  const competitorsSheet = ss.getSheetByName('Competitors');
  if (competitorsSheet && competitorsSheet.getLastRow() === 0) {
    competitorsSheet.appendRow(['ID', 'Name', 'Website', 'Category', 'Status', 'Notes']);
    // Add initial competitors
    competitorsSheet.appendRow(['siteone', 'SiteOne Landscape Supply', 'siteone.com', 'Incumbent', 'Active', 'Largest player']);
    competitorsSheet.appendRow(['landscapehub', 'LandscapeHub', 'landscapehub.com', 'Marketplace', 'Active', '']);
    competitorsSheet.appendRow(['plantant', 'Plantant', 'plantant.com', 'B2B Platform', 'Active', '']);
    competitorsSheet.appendRow(['plantbid', 'Plant Bid', 'plantbid.com', 'Auction', 'Active', '']);
    competitorsSheet.appendRow(['landone', 'Landone', 'landone.com', 'Regional', 'Active', '']);
  }

  // Findings sheet
  const findingsSheet = ss.getSheetByName('Findings');
  if (findingsSheet && findingsSheet.getLastRow() === 0) {
    findingsSheet.appendRow(['Date', 'Competitor', 'Type', 'Title', 'Description', 'Significance', 'Source URL', 'Reviewed']);
  }

  // Website Changes sheet
  const websiteSheet = ss.getSheetByName('Website Changes');
  if (websiteSheet && websiteSheet.getLastRow() === 0) {
    websiteSheet.appendRow(['Date', 'Competitor', 'Page', 'Change Type', 'Old Content', 'New Content', 'Significance']);
  }

  // Job Postings sheet
  const jobsSheet = ss.getSheetByName('Job Postings');
  if (jobsSheet && jobsSheet.getLastRow() === 0) {
    jobsSheet.appendRow(['Date', 'Competitor', 'Role', 'Department', 'Location', 'Notes']);
  }

  // Weekly Summaries sheet
  const summariesSheet = ss.getSheetByName('Weekly Summaries');
  if (summariesSheet && summariesSheet.getLastRow() === 0) {
    summariesSheet.appendRow(['Week', 'Summary', 'Key Insights', 'Action Items']);
  }

  // Competitor Profiles sheet
  const profilesSheet = ss.getSheetByName('Competitor Profiles');
  if (profilesSheet && profilesSheet.getLastRow() === 0) {
    profilesSheet.appendRow(['Competitor', 'Category', 'Summary', 'URL', 'Last Updated']);
  }

  Logger.log('Sheets initialized successfully');
}

/**
 * Main function to run weekly digest
 * Set up a time-driven trigger to run this every Monday
 */
function runWeeklyDigest() {
  // Fetch news from Google Alerts RSS
  fetchGoogleAlertsNews();

  // Generate summary using LLM
  const summary = generateWeeklySummary();

  // Send email digest
  sendDigestEmail(summary);

  Logger.log('Weekly digest completed');
}

/**
 * Custom menu for manual operations
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Competitor Intel')
    .addItem('Initialize Sheets', 'initializeSheets')
    .addItem('Fetch News Now', 'fetchGoogleAlertsNews')
    .addItem('Update Competitor Profiles', 'updateCompetitorProfiles')
    .addItem('Generate Summary', 'generateWeeklySummary')
    .addItem('Send Digest Email', 'sendDigestEmail')
    .addSeparator()
    .addItem('Run Full Weekly Digest', 'runWeeklyDigest')
    .addToUi();
}

/**
 * Set up triggers programmatically
 */
function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runWeeklyDigest') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create weekly trigger for Monday 9am
  ScriptApp.newTrigger('runWeeklyDigest')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();

  Logger.log('Triggers set up successfully');
}
