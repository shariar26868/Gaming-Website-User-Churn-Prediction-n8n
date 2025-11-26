# Churn Prediction System

A comprehensive machine learning-based system for predicting customer churn risk in gaming/casino platforms. This system analyzes user behavior patterns, engagement metrics, and financial activity to identify at-risk players and recommend targeted retention strategies.

## Overview

The system consists of two main components:
1. **Churn ML Prediction Engine** - Analyzes user data and calculates churn risk scores
2. **Churn Summary Generator** - Aggregates predictions and prepares data for database storage

## Features

- **Multi-factor Risk Assessment** - Analyzes 5 key dimensions of user behavior
- **Real-time Scoring** - Calculates churn probability (0-100%) for each user
- **Player Status Classification** - Categorizes users as Active, At Risk, Dormant, or Churned
- **Actionable Insights** - Generates specific retention strategies for each user segment
- **Value Protection** - Identifies high-value players at risk for priority intervention

## Churn Risk Model

### Risk Factors & Scoring (Max 100 points)

#### 1. Game Activity Analysis (40 points max)
- **60+ days inactive**: Critical risk (40 points)
- **30-60 days inactive**: Medium risk (25 points)
- **7-30 days inactive**: Low risk (10 points)

#### 2. Recent Engagement (20 points max)
- Zero games in last 7 days: +15 points
- Zero games in last 30 days: +20 points
- Low game frequency (<10 games/month): +10 points

#### 3. Deposit Behavior (25 points max)
- Never deposited (free player): +20 points
- 90+ days since last deposit: +25 points
- 45-90 days since deposit: +15 points

#### 4. Bonus Engagement (15 points max)
- High bonus cancellation rate (>70%): +15 points
- Zero bonus completions: +10 points

#### 5. Account Lifecycle
- New users with low engagement (<30 days, <10 games): +10 points

### Risk Level Classification

| Churn Score | Risk Level | Status |
|------------|------------|--------|
| 60-100 | 🔴 High | Churned / At Risk |
| 30-59 | 🟡 Medium | At Risk |
| 15-29 | 🟠 Low-Medium | Monitoring |
| 0-14 | 🟢 Low | Active |

## Input Data Requirements

The system expects user data from an API endpoint with the following fields:

### Required Fields
- `id` - User ID
- `email` - User email
- `created_at` - Account creation date
- `days_since_last_game` - Days since last game played
- `days_since_last_deposit` - Days since last deposit
- `total_deposits` - Total number of deposits
- `total_games_played` - Lifetime game count
- `games_last_7_days` - Games played in last 7 days
- `games_last_30_days` - Games played in last 30 days

### Optional Fields
- `first_name`, `last_name` - User name
- `country` - User country
- `bonus_cancellation_rate` - % of bonuses cancelled
- `bonus_completion_rate` - % of bonuses completed
- `total_bonuses` - Total bonuses claimed
- `total_deposit_amount` - Total $ deposited
- `total_wagered` - Total $ wagered
- `kyc_status` - KYC verification status
- `is_vip` - VIP status flag

## Output Structure

### 1. Churn Predictions (Per User)

```json
{
  "user_id": 12345,
  "email": "user@example.com",
  "churn_risk": "🔴 High",
  "churn_score": 75,
  "churn_probability": "75%",
  "player_status": "At Risk",
  "risk_factors": [
    "🔴 No game activity for 45 days",
    "🔴 90 days since last deposit"
  ],
  "retention_actions": [
    "💳 Reload bonus: 150% up to $500",
    "⚠️ Priority: Engagement campaign"
  ],
  "days_since_last_game": "45",
  "total_deposit_amount": "850.00",
  "is_vip": "Yes"
}
```

### 2. Summary Statistics

```json
{
  "analysis_date": "2024-11-26",
  "total_users_analyzed": 5000,
  "users_predicted": 4850,
  "high_risk_count": 320,
  "immediate_action_required": 180,
  "risk_distribution": {
    "🔴 High": 320,
    "🟡 Medium": 890,
    "🟠 Low-Medium": 1200,
    "🟢 Low": 2440
  }
}
```

### 3. Database Records

The system generates two types of database records:

**Summary Record** - One record per analysis run
- Analysis metadata and timestamps
- Aggregated statistics and distributions
- Campaign priority counts
- Top risk factors

**User Churn Records** - One record per user analyzed
- User identity and contact info
- Churn score and risk level
- Cleaned risk factors (emoji-free)
- Activity and financial metrics
- Retention recommendations

## Retention Strategies

The system automatically recommends targeted actions based on player status:

### Churned Players (60+ days inactive)
- 🚨 High-value reactivation offers
- 📧 "We miss you" email campaigns
- 💰 Generous welcome-back bonuses

### At Risk Players (30-60 days inactive)
- ⚠️ Priority engagement campaigns
- 🎮 Promote favorite games
- 💳 Reload deposit bonuses

### Dormant Players (No activity in 30 days)
- 💤 Wake-up campaigns
- 🎁 Free spins and no-deposit bonuses

### High-Value Players (>$500 deposits + risk score >40)
- 💎 VIP intervention
- Personal account manager assignment
- Exclusive offers and benefits

## Installation & Usage

### Prerequisites
- Node.js environment
- Access to user data API
- Database connection for storing results

### Configuration

Update the thresholds in the code if needed:

```javascript
const CHURN_THRESHOLDS = {
  activity: {
    critical: 60,  // Adjust based on your business
    warning: 30,
    safe: 7
  },
  deposit: {
    inactive: 90,
    declining: 45
  },
  // ... other thresholds
};
```

### Running the Analysis

1. **Fetch user data** from your API endpoint
2. **Run churn prediction** script on the data
3. **Run summary generation** on the prediction results
4. **Store results** in your database

The system is designed to be integrated into workflow automation tools (e.g., n8n, Zapier) for scheduled analysis runs.

## Key Metrics Tracked

- **Churn Score**: 0-100 probability of churn
- **Player Status**: Active, At Risk, Dormant, Churned
- **Days Since Last Activity**: Game play and deposit recency
- **Engagement Frequency**: Games per week/month
- **Bonus Behavior**: Completion vs cancellation rates
- **Financial Value**: Total deposits and wagering volume

## Business Impact

### Value Protection
- Identifies high-value customers at risk
- Calculates total deposit amount at risk
- Prioritizes VIP interventions

### Campaign Optimization
- Segments users by churn risk
- Recommends specific retention offers
- Tracks campaign priorities by urgency

### Predictive Analytics
- Historical trend analysis
- Risk factor frequency tracking
- Average churn score monitoring

## Best Practices

1. **Run Daily** - Schedule automated analysis for timely intervention
2. **Act Fast** - Contact high-risk users within 24-48 hours
3. **Personalize** - Use risk factors to tailor messaging
4. **Test Offers** - A/B test different retention strategies
5. **Monitor Results** - Track reactivation success rates
6. **Refine Thresholds** - Adjust scoring based on your data patterns

## Database Schema Suggestions

### churn_summary table
- `id` (primary key)
- `analyzed_date`, `created_at`
- Risk distribution counts
- Campaign priority counts
- Average metrics

### user_churn_predictions table
- `user_id`, `analysis_id` (composite key)
- `churn_score`, `churn_risk_level`, `player_status`
- Activity metrics
- Financial metrics
- `risk_factors`, `retention_actions` (text fields)

## Support & Customization

This system can be customized for different industries:
- **Gaming/Casino** (current implementation)
- **SaaS platforms** (subscription churn)
- **E-commerce** (customer retention)
- **Mobile apps** (user engagement)

Adjust thresholds, scoring weights, and retention strategies based on your specific business model and customer behavior patterns.

## License

Internal use only. Modify as needed for your organization.

---

**Last Updated**: November 2024  
**Version**: 1.0  
**Contact**: Data Science Team
