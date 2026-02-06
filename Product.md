# Competitor Intelligence System - Product Overview

## The Problem

In fast-moving B2B markets, competitive moves happen weekly. Manual competitor monitoring is:
- **Time-consuming:** 2-3 hours/week checking 5 competitor websites
- **Inconsistent:** Easy to miss critical updates during busy periods
- **Reactive:** You learn about new features from customers, not before launch
- **Unscalable:** Adding more competitors = exponentially more work

**Result:** Your team is always playing catch-up, never leading.

---

## The Solution

**Automated competitive intelligence that works while you sleep.**

This system monitors 5+ competitors 24/7, detecting website changes, new features, and market signals. Every Monday, you receive a curated digest with:
- 🚀 **New features launched** (highlighted)
- 📊 **Website changes** with before/after comparisons
- 📰 **News mentions** from Google Alerts
- 🤖 **AI-generated summaries** of each competitor's positioning

**Time saved:** 2-3 hours/week → 5 minutes reviewing the digest.

---

## Business Impact

### For Product Teams
- **Stay ahead of feature parity gaps** - Know when competitors launch new capabilities
- **Inform roadmap prioritization** - See what features competitors are investing in
- **Competitive positioning** - Understand how competitors message their differentiators

### For Sales & Customer Success
- **Battle cards always current** - Automated competitor profile updates
- **Win/loss insights** - Track which competitors are most active in your space
- **Objection handling** - Know competitor claims before customers bring them up

### For Leadership
- **Market intelligence** - Spot trends across multiple competitors (hiring, pricing, partnerships)
- **Early warning system** - Detect aggressive moves before they impact deals
- **Data-driven decisions** - Historical tracking shows competitor evolution over time

---

## How It's Built

### Architecture: Zero-Cost, Zero-Maintenance

| Component | Technology | Why |
|-----------|------------|-----|
| **Scrapers** | GitHub Actions + Node.js | Free 2000 min/month, runs automatically |
| **Database** | Google Sheets | No database setup, easy for non-technical review |
| **AI Analysis** | Gemini API (free tier) | 1M tokens/day = 1000+ summaries/week |
| **Email Digest** | Google Apps Script | Built-in email, no SMTP config |

**Total monthly cost:** $0 (all free tiers)

### Key Design Principles

1. **Fully automated** - Runs weekly without human intervention
2. **Human-in-the-loop** - AI flags changes, humans review significance
3. **Incremental snapshots** - Only surfaces *changes*, not full dumps
4. **Feature detection** - Smart keyword matching identifies new product launches
5. **Fail-safe** - If one scraper fails, others still run

### What It Tracks

**Per Competitor:**
- Homepage, features page, pricing page, blog
- Job postings (future)
- Google News alerts
- AI-generated business profile

**Change Detection:**
- New page sections/headings
- Significant content additions (>100 chars)
- New links (especially feature/pricing links)
- Feature announcement keywords ("launching", "introducing", "now available")

---

## Competitive Advantage

### Why This > Manual Checking
- **Consistency:** Never forgets to check, even during holidays
- **Speed:** Detects changes within 24-48 hours
- **Scale:** Adding competitor #10 costs the same as competitor #5
- **Historical record:** Git-tracked snapshots = timeline of competitor evolution

### Why This > Paid Tools (Crayon, Klue, etc.)
- **Cost:** $0/month vs $10k+/year for enterprise tools
- **Customization:** You control what gets tracked and how
- **No data limits:** Track 100 pages if you want
- **Open source:** Extend with job scraping, social monitoring, etc.

### Why This > Internal Dashboard
- **No engineering resources:** Built in 1-2 weeks by PM with basic JS skills
- **No infrastructure:** No servers, no deployments, no on-call
- **Instant value:** Starts delivering insights week 1

---

## Success Metrics

### Lagging Indicators (3-6 months)
- Reduced time-to-market for competitive features
- Increased win rate in competitive deals
- Earlier detection of market shifts (e.g., new category entrants)

### Leading Indicators (1-2 months)
- 2+ hours/week saved on manual competitor research
- 100% coverage of competitor website changes
- <5 min/week spent reviewing digest (vs 2-3 hours manually)
- Product/sales using insights in meetings/presentations

---

## ROI Calculation

**Assumptions:**
- PM salary: $150k/year ($75/hour)
- Time saved: 2.5 hours/week
- Weeks per year: 50

**Annual value:**
- Time saved: 2.5 hrs/week × 50 weeks × $75/hr = **$9,375**
- Cost: $0
- **ROI: ∞** (infinite)

**Plus intangibles:**
- Deals won due to competitive insight: 1-2/year = $50k-200k
- Features shipped earlier due to competitive pressure: Priceless
- Executive confidence in market positioning: Priceless

---

## Getting Started

**Week 1:** Foundation (5-10 hours)
1. Set up accounts (Google Cloud, GitHub, Gemini API)
2. Deploy website scraper for 2 priority competitors
3. Configure Google Alerts for competitor news

**Week 2:** Full automation (3-5 hours)
1. Add remaining competitors
2. Deploy email digest with AI summaries
3. Set weekly schedule

**Week 3+:** Maintenance (15 min/week)
- Review Monday digest
- Flag high-priority changes to team
- Optionally: Add new competitors as market evolves

---

## Future Roadmap

**Phase 1 (Complete):**
- ✅ Website change detection
- ✅ Feature announcement detection
- ✅ AI-powered summaries
- ✅ Weekly email digest

**Phase 2 (Next 1-2 months):**
- [ ] Job posting scraper (hiring signals)
- [ ] Slack integration (real-time alerts)
- [ ] HTML dashboard (browse historical changes)

**Phase 3 (Future):**
- [ ] Social media monitoring (LinkedIn, Twitter)
- [ ] Pricing change detection
- [ ] Competitor feature matrix (automated)
- [ ] Integration with CRM for deal attribution

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Competitor blocks scraper | Medium | Medium | Fallback to Google Alerts only |
| False positives (noise) | High | Low | Tune keyword detection, human review |
| Free tier limits exceeded | Low | Low | Usage <10% of limits currently |
| Email gets ignored | Medium | High | Include key metrics in subject line |

---

## Bottom Line

**This is not a vanity metric project.**

Every week this system runs, your team gains:
1. **Awareness** - Know what competitors are doing
2. **Context** - Understand why they're doing it (via AI analysis)
3. **Action** - Respond strategically, not reactively

**The question isn't "Should we build this?"**

**The question is: "Can we afford NOT to?"**

In a market where competitors ship weekly, ignorance is not bliss—it's a competitive disadvantage.

---

## Contact & Documentation

- **Technical Docs:** [CLAUDE.md](CLAUDE.md)
- **Setup Guide:** [config/setup-guide.md](config/setup-guide.md)
- **Competitor List:** [scripts/website-scraper/competitors.json](scripts/website-scraper/competitors.json)
- **GitHub Repo:** [timberjones/competitor-intel](https://github.com/timberjones/competitor-intel)
