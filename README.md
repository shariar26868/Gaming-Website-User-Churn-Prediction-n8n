# 🎯 Churn Prediction ML System

## 📚 Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Project Files](#project-files)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

A machine learning system that predicts customer churn risk for gaming/casino platforms by analyzing user behavior patterns. The system:

- ✅ Analyzes user activity, deposits, and engagement
- ✅ Calculates churn risk scores (0-100)
- ✅ Categorizes users into risk levels (High/Medium/Low)
- ✅ Suggests automated retention campaigns
- ✅ Tracks financial impact and value at risk
- ✅ Generates actionable insights for marketing teams

**Key Metrics:**
- **Churn Score:** 0-100 (higher = more likely to churn)
- **Player Status:** Active, At Risk, Dormant, Churned
- **Risk Levels:** Low (0-14), Low-Medium (15-29), Medium (30-59), High (60-100)

---

## 🏗️ System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   API Data  │────▶│  churn_ML.js │────▶│ML_summary.js │────▶│ Database │
│ /v2/ml/churns│    │ (Prediction) │     │(Aggregation) │     │  Storage │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐      ┌─────────────┐
                    │User Churn    │      │Summary Stats│
                    │Predictions   │      │+ Reports    │
                    └──────────────┘      └─────────────┘
```

### Data Flow
1. **Input:** User data from API endpoint (`/v2/ml/churns`)
2. **Processing:** Calculate churn scores using behavioral analytics
3. **Aggregation:** Generate summary statistics and insights
4. **Storage:** Save to database for tracking and campaigns
5. **Output:** Actionable retention strategies

---

## 📦 Installation

### Prerequisites
- Node.js 14+ or workflow automation tool (n8n, Zapier, etc.)
- MySQL 8.0+ or PostgreSQL 12+
- API access to user data endpoint

### Quick Setup

```bash
# 1. Clone or download project files
git clone https://github.com/your-org/churn-prediction-ml.git
cd churn-prediction-ml

# 2. Install dependencies (if using standalone Node.js)
npm install

# 3. Set up database
mysql -u root -p < database_schema.sql

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# 5. Test the system
node test_churn_prediction.js
```

---

## 📁 Project Files

### 1️⃣ `churn_ML.js` - Prediction Engine (Main Algorithm)

**Purpose:** Analyzes individual user behavior and calculates churn risk

**Key Features:**
- Multi-factor scoring system (5 categories)
- Threshold-based risk assessment
- Automated retention action suggestions
- Handles missing/incomplete data gracefully

**Input Format:**
```javascript
{
  id: "user_123",
  email: "user@example.com",
  days_since_last_game: 45,
  days_since_last_deposit: 60,
  total_games_played: 150,
  total_deposit_amount: 2500.00,
  bonus_cancellation_rate: 30.5,
  // ... more fields
}
```

**Output Format:**
```javascript
{
  user_id: "user_123",
  churn_score: 75,
  churn_risk: "🔴 High",
  player_status: "At Risk",
  risk_factors: [
    "🔴 Inactive for 45 days",
    "🟡 60 days since deposit"
  ],
  retention_actions: [
    "⚠️ Priority: Engagement campaign",
    "💳 Reload bonus: 150% up to $500"
  ]
}
```

**Scoring Breakdown:**
- **Game Activity (40 pts):** Last game played timing
- **Recent Engagement (20 pts):** 7-day & 30-day activity
- **Deposit Behavior (25 pts):** Deposit frequency & recency
- **Bonus Engagement (15 pts):** Bonus completion/cancellation rates
- **Account Lifecycle (10 pts):** New user onboarding success

---

### 2️⃣ `ML_summary.js` - Aggregation Engine

**Purpose:** Generates summary statistics and prepares database-ready format

**Key Features:**
- Calculates distribution of risk levels
- Identifies high-value users at risk
- Generates campaign priorities
- Cleans data (removes emojis for database)
- Tracks top risk factors across all users

**Output Structure:**
```javascript
{
  summary: {
    analysis_id: "CHURN_1733337600000",
    total_users_analyzed: 1500,
    high_risk_users: 120,
    total_deposit_at_risk: "125000.00",
    avg_churn_score: "32.50"
  },
  database_record: { /* Flat structure for SQL */ },
  user_churn_predictions: [ /* Array of cleaned user records */ ]
}
```

**Key Metrics Generated:**
- Risk distribution (High/Medium/Low counts)
- Status distribution (Churned/At Risk/Dormant/Active)
- Financial impact (Total deposits at risk)
- Campaign priorities (Urgent/Engagement/VIP counts)
- Average churn score & days inactive

---

### 3️⃣ `config.js` - Configuration

**Purpose:** Centralized configuration for easy tuning

**Adjustable Parameters:**
```javascript
THRESHOLDS: {
  ACTIVITY_CRITICAL: 60,    // Adjust churn sensitivity
  ACTIVITY_WARNING: 30,
  DEPOSIT_INACTIVE: 90,
  HIGH_BONUS_CANCEL: 70
}

WEIGHTS: {
  GAME_ACTIVITY: 40,        // Change scoring importance
  DEPOSIT_BEHAVIOR: 25,
  BONUS_ENGAGEMENT: 15
}
```

**When to Adjust:**
- **Lower thresholds** → Catch churn earlier (more alerts)
- **Higher thresholds** → Focus on severe cases only
- **Change weights** → Prioritize different behavioral signals

---

### 4️⃣ `database_schema.sql` - Database Setup

**Tables Created:**

1. **`churn_summary`** - Daily aggregated reports
   - Analysis run metadata
   - Risk distributions
   - Campaign priorities
   - Financial impact metrics

2. **`user_churn_predictions`** - Individual user predictions
   - User churn scores
   - Risk factors (cleaned text)
   - Retention actions suggested
   - Activity & financial metrics

3. **`retention_campaigns`** - Campaign tracking
   - Campaign type & offers sent
   - User engagement (opened/clicked/converted)
   - ROI tracking

**Views for Analytics:**
- `v_high_risk_users` - Quick access to urgent cases
- `v_daily_churn_trends` - Historical trend analysis
- `v_campaign_performance` - Marketing ROI metrics

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=churn_prediction
DB_USER=your_username
DB_PASSWORD=your_password

# API Configuration
API_BASE_URL=https://api.yourdomain.com
API_ENDPOINT=/v2/ml/churns
API_KEY=your_api_key

# Analysis Settings
CHURN_THRESHOLD_CRITICAL=60
CHURN_THRESHOLD_WARNING=30
MIN_GAMES_FOR_ANALYSIS=0

# Email Alerts
ALERT_EMAIL=team@yourdomain.com
ALERT_THRESHOLD_HIGH_RISK=50
ALERT_THRESHOLD_DEPOSIT_RISK=100000
```

### Tuning Thresholds

Edit `config.js` to adjust sensitivity:

```javascript
// More aggressive (catch early signs)
ACTIVITY_CRITICAL: 45,  // Default: 60
ACTIVITY_WARNING: 20,   // Default: 30

// More conservative (focus on severe cases)
ACTIVITY_CRITICAL: 90,
ACTIVITY_WARNING: 60
```

---

## 🚀 Usage Guide

### Basic Workflow

#### 1. **Fetch User Data**
```javascript
// Example: n8n HTTP Request Node
GET https://api.yourdomain.com/v2/ml/churns
Headers: {
  "Authorization": "Bearer YOUR_API_KEY"
}
```

#### 2. **Run Churn Prediction**
```javascript
// churn_ML.js processes the data
const predictions = churn_ML(apiResponse);
```

#### 3. **Generate Summary**
```javascript
// ML_summary.js aggregates results
const summary = ML_summary(predictions);
```

#### 4. **Save to Database**
```javascript
// Insert summary record
INSERT INTO churn_summary VALUES (...);

// Bulk insert user predictions
INSERT INTO user_churn_predictions VALUES (...);
```

### Automation Setup (n8n Example)

```
┌──────────────┐
│   Schedule   │ Trigger: Daily at 2 AM
└──────┬───────┘
       │
┌──────▼───────┐
│  HTTP Request│ GET /v2/ml/churns
└──────┬───────┘
       │
┌──────▼───────┐
│  Function 1  │ Run churn_ML.js
└──────┬───────┘
       │
┌──────▼───────┐
│  Function 2  │ Run ML_summary.js
└──────┬───────┘
       │
┌──────▼───────┐
│MySQL Insert 1│ Save churn_summary
└──────┬───────┘
       │
┌──────▼───────┐
│MySQL Insert 2│ Save user predictions
└──────────────┘
```

---

## 📊 API Reference

### Input Data Schema

**Required Fields:**
```javascript
{
  id: string,                      // User ID (required)
  email: string,                   // User email
  days_since_last_game: number,    // Days since last activity
  days_since_last_deposit: number, // Days since last deposit
  total_games_played: number,      // Lifetime game count
  total_deposits: number,          // Lifetime deposit count
  total_deposit_amount: number     // Total deposited ($)
}
```

**Optional Fields:**
```javascript
{
  games_last_7_days: number,
  games_last_30_days: number,
  bonus_cancellation_rate: number,  // Percentage
  bonus_completion_rate: number,    // Percentage
  total_bonuses: number,
  total_wagered: number,
  kyc_status: string,
  is_vip: boolean,
  country: string,
  created_at: timestamp
}
```

### Output Data Schema

**User Prediction Record:**
```javascript
{
  user_id: "USER_123",
  churn_score: 75,                    // 0-100
  churn_risk_level: "High",           // Low/Medium/High
  player_status: "At Risk",           // Active/At Risk/Dormant/Churned
  risk_factors: "Inactive for 45 days; Zero games in last 30 days",
  retention_actions: "Priority engagement campaign; Reload bonus 150%",
  days_since_last_game: 45,
  total_deposit_amount: 2500.00,
  analyzed_at: "2024-12-04"
}
```

**Summary Record:**
```javascript
{
  analysis_id: "CHURN_1733337600000",
  analyzed_date: "2024-12-04",
  total_users_analyzed: 1500,
  high_risk_count: 120,
  medium_risk_count: 350,
  low_risk_count: 1030,
  total_deposit_at_risk: "125000.00",
  avg_churn_score: "32.50",
  urgent_action_count: 45
}
```

---

## 🗄️ Database Schema

### Table: `churn_summary`
Stores daily aggregated analysis results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) | Primary key (CHURN_timestamp) |
| `analyzed_date` | DATE | Analysis run date |
| `total_analyzed` | INT | Users in dataset |
| `high_risk_count` | INT | Users with score ≥60 |
| `total_deposit_at_risk` | DECIMAL | $ at risk from high-risk users |
| `avg_churn_score` | DECIMAL | Average score across all users |
| `top_risk_factors` | TEXT | Most common risk factors |

### Table: `user_churn_predictions`
Stores individual user predictions.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | VARCHAR(50) | User identifier |
| `churn_score` | INT | Risk score (0-100) |
| `player_status` | VARCHAR(20) | Active/At Risk/Dormant/Churned |
| `risk_factors` | TEXT | Reasons for churn risk |
| `retention_actions` | TEXT | Suggested campaigns |
| `total_deposit_amount` | DECIMAL | User lifetime value |
| `analyzed_at` | DATE | Prediction date |

### Table: `retention_campaigns`
Tracks marketing campaigns and ROI.

| Column | Type | Description |
|--------|------|-------------|
| `campaign_id` | VARCHAR(50) | Unique campaign ID |
| `user_id` | VARCHAR(50) | Target user |
| `campaign_type` | VARCHAR(50) | Reactivation/Engagement/VIP |
| `converted` | BOOLEAN | Did user return? |
| `conversion_amount` | DECIMAL | Revenue generated |

---

## 🚀 Deployment

### Production Checklist

- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up daily cron job / scheduled workflow
- [ ] Enable error monitoring
- [ ] Set up email alerts for high-risk users
- [ ] Configure database backups
- [ ] Test with sample data
- [ ] Document custom threshold adjustments

### Recommended Schedule

```bash
# Daily analysis (early morning before business hours)
0 2 * * * /usr/bin/node /path/to/run_analysis.js

# Weekly summary report
0 9 * * 1 /usr/bin/node /path/to/weekly_report.js
```

### Performance Optimization

**For large datasets (10,000+ users):**
1. Enable database indexes (already in schema)
2. Process in batches of 1,000 users
3. Use database connection pooling
4. Cache API responses if data doesn't change frequently

---
