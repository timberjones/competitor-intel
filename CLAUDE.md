# CLAUDE.md - Competitor Intelligence System

## Project Overview

Automated competitive intelligence system for GoMaterials that monitors competitors for website changes, news, and job postings. Semi-automated with weekly email digests for human review.

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Scrapers | Node.js 20+ | Website and job monitoring |
| Scheduler | GitHub Actions | Weekly automation |
| Database | Google Sheets | Central data storage |
| Analysis | Google Apps Script | RSS processing, LLM calls, email |
| LLM | Gemini API (free tier) | Summarization and significance scoring |

## Project Structure

```
competitor-intel/
├── .github/workflows/
│   ├── website-monitor.yml    # Weekly website scraping
│   └── job-monitor.yml        # Weekly job posting check
├── scripts/
│   ├── website-scraper/
│   │   ├── index.js           # Main scraper
│   │   ├── competitors.json   # URLs to monitor
│   │   └── package.json
│   ├── job-scraper/
│   │   └── index.js
│   └── utils/
│       └── sheets-client.js   # Google Sheets API helper
├── apps-script/
│   ├── Code.gs                # Main entry, config, menu
│   ├── WebhookReceiver.gs     # Receives data from GitHub Actions (NO Google Cloud!)
│   ├── NewsMonitor.gs         # Google Alerts RSS processing
│   ├── LLMAnalysis.gs         # Gemini API integration
│   └── EmailDigest.gs         # Weekly report generation
├── snapshots/                  # Website content snapshots (git-tracked)
└── config/
    ├── setup-guide.md         # Account setup instructions
    └── alerts.md              # Google Alerts setup guide
```

## Commands

### All Execution is Cloud-Based

**No local execution required.** All scrapers run on GitHub Actions (GitHub's infrastructure) or Google Apps Script (Google's infrastructure). This ensures no IP tracing back to your machine.

### GitHub Actions (via GitHub CLI or Web UI)

```bash
# Manually trigger website monitor
gh workflow run website-monitor.yml

# Manually trigger job monitor
gh workflow run job-monitor.yml

# View workflow runs
gh run list --workflow=website-monitor.yml

# View logs from a specific run
gh run view <run-id> --log
```

### Google Apps Script (via Sheet menu)

All Apps Script functions are triggered via:
1. **Sheet menu:** Competitor Intel → [function name]
2. **Time-based triggers:** Set up via `setupTriggers()` function
3. **Apps Script editor:** Run → [function name]

## Environment Variables / Secrets

Set these as GitHub repository secrets:

| Secret | Description |
|--------|-------------|
| `APPS_SCRIPT_WEBHOOK_URL` | Apps Script web app URL (from deployment) |
| `GEMINI_API_KEY` | Gemini API key for LLM analysis (optional, for future use) |

For Apps Script, set these in Project Settings > Script Properties:
- `GEMINI_API_KEY`

## Google Sheet Structure

**Note:** You'll create your own sheet (no billing required!)

| Tab | Columns | Purpose |
|-----|---------|---------|
| Competitors | ID, Name, Website, Category, Status, Notes | Master list |
| Findings | Date, Competitor, Type, Title, Description, Significance, Source URL, Reviewed | All discoveries |
| Website Changes | Date, Competitor, Page, Change Type, Old Content, New Content, Significance | Detailed diffs |
| Job Postings | Date, Competitor, Role, Department, Location, Notes | Hiring activity |
| Weekly Summaries | Week, Summary, Key Insights, Action Items | LLM-generated digests |

## Competitors Tracked

| ID | Name | Category |
|----|------|----------|
| siteone | SiteOne Landscape Supply | Incumbent |
| landscapehub | LandscapeHub | Marketplace |
| plantant | Plantant | B2B Platform |
| plantbid | Plant Bid | Auction |
| landone | Landone | Regional |

## Architecture Flow

**All execution happens in the cloud - nothing runs on your machine.**

```
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS (GitHub's servers)            │
│  - Website scraper (Node.js)                                    │
│  - Job posting scraper (Node.js)                                │
│  - Runs weekly on schedule or manual trigger                    │
│  - IP: GitHub/Microsoft infrastructure                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ writes to
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE SHEETS (Google's servers)             │
│  - Central database for all findings                            │
│  - Human review interface                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │ processed by
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GOOGLE APPS SCRIPT (Google's servers)           │
│  - RSS feed processing (Google Alerts)                          │
│  - LLM analysis (calls Gemini API)                              │
│  - Email digest generation                                      │
│  - IP: Google infrastructure                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Weekly flow:**
1. Monday 9am UTC: GitHub Actions triggers website scraper
2. Scraper runs on GitHub's servers, fetches competitor pages
3. Changes detected → POSTed to Apps Script webhook
4. Webhook writes changes to Google Sheets
5. Apps Script trigger runs → fetches Google Alerts RSS
6. Apps Script calls Gemini API → generates summary
7. Email digest sent to you for review

## Key Files to Edit

| Task | File(s) |
|------|---------|
| Add new competitor | `scripts/website-scraper/competitors.json` |
| Change scraping logic | `scripts/website-scraper/index.js` |
| Add Google Alert RSS | `apps-script/NewsMonitor.gs` (ALERT_FEEDS object) |
| Modify email format | `apps-script/EmailDigest.gs` |
| Change LLM prompts | `apps-script/LLMAnalysis.gs` |
| Adjust schedule | `.github/workflows/*.yml` (cron expression) |

## Development Workflow

1. **Adding a competitor:**
   - Add to `competitors.json` with pages to monitor
   - Commit and push to GitHub
   - Create Google Alerts for the competitor name
   - Add RSS feed URL to `NewsMonitor.gs` in Apps Script editor

2. **Testing changes (all cloud-based):**
   - Push code changes to GitHub
   - Trigger workflow manually: `gh workflow run website-monitor.yml`
   - Check GitHub Actions logs for errors
   - Check Google Sheet for new rows

3. **Deploying Apps Script:**
   - Copy `.gs` files to Apps Script editor (Extensions → Apps Script)
   - Run `initializeSheets()` once to set up headers
   - Run `setupTriggers()` to configure automation

4. **Initial setup (ZERO BILLING REQUIRED):**
   - Create Google Sheet with tabs
   - Deploy Apps Script as web app (Extensions → Apps Script → Deploy)
   - Copy webhook URL from deployment
   - Create GitHub repo and push code
   - Set up repository secrets (webhook URL, API key)
   - Enable GitHub Actions
   - No Google Cloud or service account needed!

## Conventions

- **Dates:** Always `YYYY-MM-DD` format
- **Significance levels:** High, Medium, Low
- **Finding types:** Website, News, Job, Discovery
- **Snapshots:** JSON files named `{competitorId}_{pageName}.json`

## Troubleshooting

### Scraper fails with 403/blocked
- Update User-Agent string in `index.js`
- Add delay between requests (currently 1s)
- GitHub Actions IPs are shared; some aggressive sites may block
- Consider using a proxy service if persistent issues

### GitHub Actions workflow fails
- Check logs: `gh run view <run-id> --log`
- Verify secrets are set correctly in repo settings
- Check if dependencies installed correctly

### Google Sheets API quota exceeded
- Free tier: 300 requests/minute
- Batch writes where possible
- Add exponential backoff

### Apps Script timeout
- Scripts timeout after 6 minutes
- Process in smaller batches if needed
- Use continuation tokens for large datasets

### Apps Script debugging
- Use `Logger.log()` statements
- View logs: View → Logs in Apps Script editor
- Check Executions tab for error details

## Future Enhancements (Not Yet Implemented)

- [ ] Job posting scraper (Phase 3)
- [ ] HTML dashboard on GitHub Pages
- [ ] Social media monitoring
- [ ] Slack integration for real-time alerts
- [ ] Historical trend charts
