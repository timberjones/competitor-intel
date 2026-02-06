# Competitor Intelligence System

Automated monitoring of GoMaterials competitors for website changes, news, and job postings.

## Key Design Principle

**100% cloud-based execution.** Nothing runs on your local machine:
- **GitHub Actions** → Scrapers run on GitHub's infrastructure
- **Google Apps Script** → Analysis runs on Google's infrastructure
- **No IP tracing** back to you

## Architecture

```
GitHub Actions (scrapers) → Google Sheets (database) → Apps Script (analysis) → Email digest
         ↑
   Google Alerts (news RSS)
```

## Setup

### 1. Google Sheet

Create a Google Sheet with these tabs:
- **Competitors** - List of competitors to track
- **Findings** - All discovered changes/news
- **Website Changes** - Detailed website diffs
- **Job Postings** - Competitor hiring activity
- **Weekly Summaries** - LLM-generated summaries

### 2. Google Alerts

Set up alerts at https://www.google.com/alerts for:
- Each competitor name
- Discovery keywords (see `config/alerts.md`)

### 3. Environment Variables

Set these as GitHub repository secrets:

```
GOOGLE_SHEETS_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Apps Script

1. Open the Google Sheet
2. Extensions → Apps Script
3. Copy files from `apps-script/` folder
4. Set up triggers for weekly execution

## Components

### Website Monitor
- Runs weekly via GitHub Actions
- Compares page content against previous snapshots
- Detects: new pages, content changes, pricing updates

### News Monitor
- Google Alerts RSS → Apps Script
- Processes daily, stores in Findings sheet

### Job Monitor
- Scrapes career pages weekly
- Tracks hiring patterns by department

### Analysis
- Weekly LLM summarization of all findings
- Significance scoring (High/Medium/Low)
- Email digest sent every Monday

## Competitors Tracked

| Name | Website | Category |
|------|---------|----------|
| SiteOne | siteone.com | Incumbent |
| LandscapeHub | landscapehub.com | Marketplace |
| Plantant | plantant.com | B2B Platform |
| Plant Bid | plantbid.com | Auction |
| Landone | landone.com | Regional |

## Cost

~$2/month (LLM API only, everything else is free tier)
