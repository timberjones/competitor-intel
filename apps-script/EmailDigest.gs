/**
 * Email Digest - Weekly Report Generation
 *
 * Generates and sends HTML email digests
 */

/**
 * Send the weekly digest email
 * @param {Object} summary - Optional pre-generated summary (from generateWeeklySummary)
 */
function sendDigestEmail(summary) {
  // Generate summary if not provided
  if (!summary) {
    summary = generateWeeklySummary();
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const findingsSheet = ss.getSheetByName('Findings');
  const websiteSheet = ss.getSheetByName('Website Changes');

  // Get data from the past week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekStart = Utilities.formatDate(oneWeekAgo, 'UTC', 'yyyy-MM-dd');

  const findings = getRecentFindingsForEmail(findingsSheet, weekStart);
  const websiteChanges = getRecentChangesForEmail(websiteSheet, weekStart);

  // Build email HTML
  const htmlBody = buildEmailHtml(summary, findings, websiteChanges);
  const plainBody = buildPlainTextEmail(summary, findings, websiteChanges);

  // Get current date for subject
  const today = Utilities.formatDate(new Date(), 'UTC', 'MMM d, yyyy');

  // Send email to all recipients
  for (const recipient of CONFIG.DIGEST_RECIPIENTS) {
    try {
      GmailApp.sendEmail(
        recipient,
        `Competitor Intelligence Digest - ${today}`,
        plainBody,
        {
          htmlBody: htmlBody,
          name: 'Competitor Intel Bot'
        }
      );
      Logger.log(`Digest sent to ${recipient}`);
    } catch (error) {
      Logger.log(`Error sending to ${recipient}: ${error.message}`);
    }
  }
}

/**
 * Get findings formatted for email
 */
function getRecentFindingsForEmail(sheet, startDate) {
  const data = sheet.getDataRange().getValues();
  const findings = {
    high: [],
    medium: [],
    low: []
  };

  for (let i = 1; i < data.length; i++) {
    const rowDate = data[i][0];
    if (rowDate && rowDate >= startDate) {
      const item = {
        date: data[i][0],
        competitor: data[i][1],
        type: data[i][2],
        title: data[i][3],
        description: data[i][4],
        significance: data[i][5],
        url: data[i][6]
      };

      const sig = (item.significance || 'Medium').toLowerCase();
      if (sig === 'high') findings.high.push(item);
      else if (sig === 'low') findings.low.push(item);
      else findings.medium.push(item);
    }
  }

  return findings;
}

/**
 * Get website changes formatted for email
 */
function getRecentChangesForEmail(sheet, startDate) {
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
        oldContent: data[i][4],
        newContent: data[i][5],
        significance: data[i][6]
      });
    }
  }

  return changes;
}

/**
 * Build HTML email content
 */
function buildEmailHtml(summary, findings, changes) {
  const totalFindings = findings.high.length + findings.medium.length + findings.low.length;
  const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
    .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
    .section { padding: 20px; border-bottom: 1px solid #eee; }
    .summary-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .high { border-left: 4px solid #e74c3c; padding-left: 10px; margin: 10px 0; }
    .medium { border-left: 4px solid #f39c12; padding-left: 10px; margin: 10px 0; }
    .low { border-left: 4px solid #95a5a6; padding-left: 10px; margin: 10px 0; }
    .competitor-tag { background: #3498db; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .stats { display: flex; justify-content: space-around; text-align: center; padding: 15px; background: #ecf0f1; }
    .stat-item { }
    .stat-number { font-size: 24px; font-weight: bold; color: #2c3e50; }
    .stat-label { font-size: 12px; color: #7f8c8d; }
    h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    a { color: #3498db; }
    .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Competitor Intelligence Digest</h1>
    <p>Weekly Summary - ${Utilities.formatDate(new Date(), 'UTC', 'MMMM d, yyyy')}</p>
  </div>

  <div class="stats">
    <div class="stat-item">
      <div class="stat-number">${totalFindings}</div>
      <div class="stat-label">Total Findings</div>
    </div>
    <div class="stat-item">
      <div class="stat-number" style="color: #e74c3c;">${findings.high.length}</div>
      <div class="stat-label">High Priority</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">${changes.length}</div>
      <div class="stat-label">Website Changes</div>
    </div>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="summary-box">
      <p>${escapeHtml(summary.summary)}</p>
    </div>
  </div>

  <div class="section">
    <h2>Key Insights</h2>
    ${formatListAsHtml(summary.insights)}
  </div>

  <div class="section">
    <h2>Recommended Actions</h2>
    ${formatListAsHtml(summary.actionItems)}
  </div>`;

  // High priority findings
  if (findings.high.length > 0) {
    html += `
  <div class="section">
    <h2>High Priority Items</h2>`;
    findings.high.forEach(f => {
      html += `
    <div class="high">
      <span class="competitor-tag">${escapeHtml(f.competitor)}</span>
      <strong>${escapeHtml(f.title)}</strong>
      <p>${escapeHtml(f.description)}</p>
      ${f.url ? `<a href="${escapeHtml(f.url)}">View Source</a>` : ''}
    </div>`;
    });
    html += `</div>`;
  }

  // Medium priority findings
  if (findings.medium.length > 0) {
    html += `
  <div class="section">
    <h2>Medium Priority Items</h2>`;
    findings.medium.forEach(f => {
      html += `
    <div class="medium">
      <span class="competitor-tag">${escapeHtml(f.competitor)}</span>
      <strong>${escapeHtml(f.title)}</strong>
      <p>${escapeHtml(f.description)}</p>
    </div>`;
    });
    html += `</div>`;
  }

  // Website changes
  if (changes.length > 0) {
    html += `
  <div class="section">
    <h2>Website Changes Detected</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #ecf0f1;">
        <th style="padding: 10px; text-align: left;">Competitor</th>
        <th style="padding: 10px; text-align: left;">Page</th>
        <th style="padding: 10px; text-align: left;">Change</th>
        <th style="padding: 10px; text-align: left;">Priority</th>
      </tr>`;
    changes.forEach(c => {
      html += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(c.competitor)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(c.page)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(c.changeType)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(c.significance)}</td>
      </tr>`;
    });
    html += `</table></div>`;
  }

  html += `
  <div class="footer">
    <p><a href="${sheetUrl}">View Full Data in Google Sheets</a></p>
    <p>This is an automated report from GoMaterials Competitor Intelligence System</p>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Build plain text email (fallback)
 */
function buildPlainTextEmail(summary, findings, changes) {
  let text = `COMPETITOR INTELLIGENCE DIGEST
Weekly Summary - ${Utilities.formatDate(new Date(), 'UTC', 'MMMM d, yyyy')}
${'='.repeat(50)}

EXECUTIVE SUMMARY
${summary.summary}

KEY INSIGHTS
${summary.insights}

RECOMMENDED ACTIONS
${summary.actionItems}

`;

  if (findings.high.length > 0) {
    text += `HIGH PRIORITY ITEMS\n${'-'.repeat(30)}\n`;
    findings.high.forEach(f => {
      text += `* [${f.competitor}] ${f.title}\n  ${f.description}\n\n`;
    });
  }

  if (findings.medium.length > 0) {
    text += `\nMEDIUM PRIORITY ITEMS\n${'-'.repeat(30)}\n`;
    findings.medium.forEach(f => {
      text += `* [${f.competitor}] ${f.title}\n`;
    });
  }

  if (changes.length > 0) {
    text += `\nWEBSITE CHANGES\n${'-'.repeat(30)}\n`;
    changes.forEach(c => {
      text += `* ${c.competitor} (${c.page}): ${c.changeType}\n`;
    });
  }

  text += `\n${'='.repeat(50)}\nView full data: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`;

  return text;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format a string with bullet points as HTML list
 */
function formatListAsHtml(text) {
  if (!text || text === 'N/A') {
    return '<p>No items this week.</p>';
  }

  // Split by newlines and bullet characters
  const lines = text.split(/\n/).filter(line => line.trim());

  if (lines.length === 0) {
    return '<p>No items this week.</p>';
  }

  let html = '<ul>';
  lines.forEach(line => {
    // Remove leading bullet/dash characters
    const cleanLine = line.replace(/^[\s\-\*\•]+/, '').trim();
    if (cleanLine) {
      html += `<li>${escapeHtml(cleanLine)}</li>`;
    }
  });
  html += '</ul>';

  return html;
}

/**
 * Test function to preview email without sending
 */
function previewDigestEmail() {
  const summary = {
    summary: 'This is a test summary. PlantBid launched new features this week, and SiteOne updated their pricing page.',
    insights: '- PlantBid is expanding their buyer tools\n- SiteOne may be adjusting pricing strategy',
    actionItems: '- Monitor PlantBid closely\n- Compare pricing with SiteOne'
  };

  const html = buildEmailHtml(summary, { high: [], medium: [], low: [] }, []);

  // Log the HTML (you can copy this to a browser to preview)
  Logger.log(html);

  // Also create a draft instead of sending
  GmailApp.createDraft(
    Session.getActiveUser().getEmail(),
    'TEST - Competitor Intelligence Digest Preview',
    'See HTML version',
    { htmlBody: html }
  );

  Logger.log('Preview draft created in Gmail');
}
