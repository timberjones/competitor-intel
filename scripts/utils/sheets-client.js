import { google } from 'googleapis';

/**
 * Google Sheets client for competitor intelligence data
 */
export class SheetsClient {
  constructor(spreadsheetId, credentials) {
    this.spreadsheetId = spreadsheetId;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentials),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  /**
   * Append a row to a sheet
   */
  async appendRow(sheetName, values) {
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values]
      }
    });
  }

  /**
   * Append multiple rows to a sheet
   */
  async appendRows(sheetName, rows) {
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows
      }
    });
  }

  /**
   * Read all data from a sheet
   */
  async readSheet(sheetName) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:Z`
    });
    return response.data.values || [];
  }

  /**
   * Find a row by value in a column
   */
  async findRow(sheetName, column, value) {
    const data = await this.readSheet(sheetName);
    if (data.length === 0) return null;

    const headers = data[0];
    const colIndex = headers.indexOf(column);
    if (colIndex === -1) return null;

    for (let i = 1; i < data.length; i++) {
      if (data[i][colIndex] === value) {
        return { rowIndex: i + 1, data: data[i], headers };
      }
    }
    return null;
  }

  /**
   * Update a specific cell
   */
  async updateCell(sheetName, cell, value) {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!${cell}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]]
      }
    });
  }

  /**
   * Log a website change finding
   */
  async logWebsiteChange(competitor, page, changeType, oldContent, newContent, significance) {
    const date = new Date().toISOString().split('T')[0];
    await this.appendRow('Website Changes', [
      date,
      competitor,
      page,
      changeType,
      oldContent?.substring(0, 500) || '',
      newContent?.substring(0, 500) || '',
      significance
    ]);
  }

  /**
   * Log a general finding
   */
  async logFinding(competitor, type, title, description, significance, sourceUrl) {
    const date = new Date().toISOString().split('T')[0];
    await this.appendRow('Findings', [
      date,
      competitor,
      type,
      title,
      description,
      significance,
      sourceUrl,
      'No' // Reviewed column
    ]);
  }

  /**
   * Log a job posting
   */
  async logJobPosting(competitor, role, department, location, notes) {
    const date = new Date().toISOString().split('T')[0];
    await this.appendRow('Job Postings', [
      date,
      competitor,
      role,
      department,
      location,
      notes
    ]);
  }
}
