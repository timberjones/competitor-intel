# Account Setup Guide (No Billing Required)

Complete these steps in order. **Budget: $0** - No billing info needed anywhere!

---

## Step 1: Create Google Sheet

**Time: ~10 minutes**

### 1.1 Create the Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank** to create a new spreadsheet
3. Name it: `Competitor Intelligence`
4. Note the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[THIS-IS-YOUR-SHEET-ID]/edit
   ```
   Save this ID - you'll need it later!

### 1.2 Create Required Tabs

Create these tabs (sheets) by clicking the **+** at the bottom:

| Tab Name | Purpose |
|----------|---------|
| Competitors | Master list of competitors |
| Findings | All discoveries (changes, news, jobs) |
| Website Changes | Detailed website diffs |
| Job Postings | Hiring activity |
| Weekly Summaries | LLM-generated digests |

### 1.3 Add Headers to Each Tab

**Competitors tab:**
```
ID | Name | Website | Category | Status | Notes
```

**Findings tab:**
```
Date | Competitor | Type | Title | Description | Significance | Source URL | Reviewed
```

**Website Changes tab:**
```
Date | Competitor | Page | Change Type | Old Content | New Content | Significance
```

**Job Postings tab:**
```
Date | Competitor | Role | Department | Location | Notes
```

**Weekly Summaries tab:**
```
Week | Summary | Key Insights | Action Items
```

---

## Step 2: Deploy Apps Script as Web App

**Time: ~15 minutes**

### 2.1 Open Apps Script Editor

1. In your Google Sheet, click **Extensions** > **Apps Script**
2. A new tab opens with the script editor

### 2.2 Copy All Script Files

You'll need to copy 5 files into the Apps Script editor:

1. **Code.gs** - Main entry point (already exists, replace it)
2. **WebhookReceiver.gs** - Receives data from GitHub Actions (add new file)
3. **NewsMonitor.gs** - Google Alerts RSS processing (add new file)
4. **LLMAnalysis.gs** - Gemini API integration (add new file)
5. **EmailDigest.gs** - Email digest generation (add new file)

**To add a new file:**
- Click the **+** next to "Files" in the left sidebar
- Select **Script**
- Name it exactly as shown above (without .gs extension)
- Paste the content from the corresponding file in `apps-script/` folder

### 2.3 Set Script Properties

1. Click the gear icon ⚙️ (Project Settings) in the left sidebar
2. Scroll down to **Script Properties**
3. Click **Add script property**
4. Add this property:
   - Property: `GEMINI_API_KEY`
   - Value: (you'll get this in Step 3)

### 2.4 Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Fill in:
   - Description: `Competitor Intel Webhook`
   - Execute as: **Me** (your email)
   - Who has access: **Anyone** (required for GitHub Actions to access)
5. Click **Deploy**
6. Review permissions and click **Authorize access**
7. Choose your Google account and click **Allow**
8. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
   **Save this URL** - you'll need it for GitHub secrets!

### 2.5 Initialize the Sheets

1. In the Apps Script editor, select **Code.gs** from the files list
2. From the function dropdown at the top, select `initializeSheets`
3. Click **Run**
4. This will populate your sheet tabs with headers and initial data

---

## Step 3: Get Gemini API Key

**Time: ~5 minutes**

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **Get API key** (top right)
4. Click **Create API key**
5. Select your project or create one
6. Copy the API key - **save this securely!**

**Now add it to Apps Script:**
1. Go back to your Apps Script editor
2. Click the gear icon ⚙️ (Project Settings)
3. Find **Script Properties** and click **Edit script properties**
4. Update `GEMINI_API_KEY` with your actual key
5. Click **Save script properties**

**Free tier limits:** 15 requests/minute, 1 million tokens/day (more than enough)

---

## Step 4: Create GitHub Repository

**Time: ~10 minutes**

### 4.1 Create the Repository

1. Go to [GitHub](https://github.com)
2. Click **+** > **New repository**
3. Name: `competitor-intel`
4. Set to **Private** (recommended)
5. Check "Add a README file"
6. Click **Create repository**

### 4.2 Add Repository Secrets

1. Go to your repo's **Settings** tab
2. Click **Secrets and variables** > **Actions**
3. Click **New repository secret** for each:

| Secret Name | Value |
|-------------|-------|
| `APPS_SCRIPT_WEBHOOK_URL` | The Web App URL from Step 2.4 |
| `GEMINI_API_KEY` | Your Gemini API key from Step 3 |

**Important:** Paste the entire webhook URL including `https://` and `/exec` at the end.

### 4.3 Push Your Code to GitHub

Open terminal/command prompt:

```bash
cd c:\Users\quant\OneDrive\Documents\competitor-intel

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial competitor intel system"

# Add your GitHub repo as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/competitor-intel.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 5: Enable GitHub Actions

1. Go to your repo on GitHub
2. Click the **Actions** tab
3. If prompted, click **I understand my workflows, go ahead and enable them**

---

## Step 6: Set Up Google Alerts (Optional but Recommended)

**Time: ~10 minutes**

1. Go to [Google Alerts](https://www.google.com/alerts)
2. Create alerts for each competitor:
   - "PlantANT" OR "Plantant"
   - "PlantBid"
   - "SiteOne Landscape Supply"
   - "LandscapeHub"
   - "LandOne Group"
3. For each alert, click **Show options** and set:
   - How often: **As-it-happens**
   - Sources: **Automatic**
   - Language: **English**
   - Deliver to: **RSS feed**
4. Copy the RSS feed URL (looks like `https://www.google.com/alerts/feeds/...`)
5. In your Apps Script editor, open **NewsMonitor.gs**
6. Update the `ALERT_FEEDS` object with your RSS URLs:
   ```javascript
   const ALERT_FEEDS = {
     'PlantANT': 'https://www.google.com/alerts/feeds/YOUR-FEED-ID-1',
     'PlantBid': 'https://www.google.com/alerts/feeds/YOUR-FEED-ID-2',
     // etc.
   };
   ```
7. Click **Save**

---

## Step 7: Set Up Weekly Automation

**Time: ~2 minutes**

In your Apps Script editor:

1. Select `setupTriggers` from the function dropdown
2. Click **Run**
3. This creates a weekly trigger for Monday at 9am UTC

You can verify by clicking the clock icon ⏰ (Triggers) in the left sidebar.

---

## Step 8: Test Everything

### Test the Webhook

1. In Apps Script editor, open **WebhookReceiver.gs**
2. Select `testWebhook` from the function dropdown
3. Click **Run**
4. Check your Google Sheet's "Website Changes" tab - should have a test row

### Test the Scraper

In your terminal:
```bash
gh workflow run website-monitor.yml
```

Then check:
- GitHub Actions tab for workflow status
- Your Google Sheet for new rows

### Test the Email Digest

In Apps Script editor:
1. Select `previewDigestEmail` from the function dropdown (in EmailDigest.gs)
2. Click **Run**
3. Check your Gmail drafts for a preview

---

## Verify Everything Works

Run this checklist:

- [ ] Google Sheet created with correct tabs and headers
- [ ] Apps Script files copied and saved
- [ ] GEMINI_API_KEY set in Script Properties
- [ ] Web app deployed and URL copied
- [ ] Gemini API key obtained
- [ ] GitHub repo created (private)
- [ ] Both secrets added to GitHub repo (webhook URL and API key)
- [ ] Code pushed to GitHub
- [ ] GitHub Actions enabled
- [ ] Google Alerts created with RSS feeds (optional)
- [ ] Weekly trigger set up in Apps Script
- [ ] Test webhook successful
- [ ] Test scraper successful

---

## Troubleshooting

### Webhook returns 403 or permission error
- Redeploy the web app: Deploy > Manage deployments > Edit > Deploy
- Make sure "Who has access" is set to **Anyone**

### GitHub Actions workflow fails
- Check logs: `gh run view <run-id> --log`
- Verify webhook URL secret is correct (including https:// and /exec)
- Test the webhook URL in a browser - should return `{"status":"online"}`

### Apps Script timeout
- Scripts timeout after 6 minutes
- This shouldn't happen with your usage, but if it does, reduce batch sizes

### Gemini API "API key not configured"
- Make sure GEMINI_API_KEY is set in Script Properties (not in the code)
- The key should be the actual API key, not the property name

### Email digest not sending
- Update CONFIG.DIGEST_RECIPIENTS in Code.gs with your actual email
- Make sure trigger is set up (run setupTriggers function)
- Check Executions log (clock icon with lines) for errors

---

## What's Next?

Once you've completed this setup:

1. **Week 1:** Let it run for a week and monitor the results
2. **Adjust:** Fine-tune which pages to monitor in `competitors.json`
3. **Scale:** Add more competitors or Google Alerts as needed

The system will now:
- Scrape competitor sites every Monday at 9am UTC
- Process Google Alerts for news
- Generate AI summaries
- Send you a weekly digest email

**All for $0!** 🎉
