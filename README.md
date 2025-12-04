# 🎯 Churn Prediction ML System - Complete Project
<img width="1688" height="482" alt="Screenshot 2025-12-04 111511" src="https://github.com/user-attachments/assets/a9c42332-38e1-4ab6-a703-518bdcfe47e9" />

## 📁 Project Structure
```
churn-prediction-system/
├── ML_churn.js           # Main prediction engine
├── ML_summary.js         # Summary aggregation
├── README.md
├── Churn Full Workflow for Deploy- Latest Version.json           

```

---

## 📄 FILE 1: `ML_churn.js`

```javascript
// ====================================================
// CHURN PREDICTION ENGINE
// ====================================================
// Purpose: Analyzes user behavior and predicts churn risk
// Input: User data from API endpoint
// Output: Churn predictions with risk scores and retention actions
// ====================================================

// Get all users from API
const response = $input.first().json;
const users = response[0]?.data || response.data || [];
const results = [];

// Define churn prediction thresholds
const CHURN_THRESHOLDS = {
  activity: {
    critical: 60,      // 60+ days = high churn risk
    warning: 30,       // 30-60 days = medium risk
    safe: 7            // 0-7 days = active
  },
  deposit: {
    inactive: 90,      // 90+ days since deposit
    declining: 45      // 45-90 days
  },
  engagement: {
    low_games: 10,     // Less than 10 games in period
    no_activity: 0
  },
  bonus: {
    high_cancel: 70,   // 70%+ cancellation = disengaged
    zero_completion: 0
  }
};

for (let user of users) {
  let churnRisk = "Low";
  let churnScore = 0;
  let riskFactors = [];
  let retentionActions = [];
  let playerStatus = "Active";
  let churnProbability = 0;

  // Extract metrics
  const daysSinceLastGame = parseFloat(user.days_since_last_game) || 999;
  const daysSinceDeposit = parseFloat(user.days_since_last_deposit) || 999;
  const totalDeposits = parseInt(user.total_deposits) || 0;
  const totalGames = parseInt(user.total_games_played) || 0;
  const gamesLast7Days = parseInt(user.games_last_7_days) || 0;
  const gamesLast30Days = parseInt(user.games_last_30_days) || 0;
  const bonusCancelRate = parseFloat(user.bonus_cancellation_rate) || 0;
  const bonusCompletionRate = parseFloat(user.bonus_completion_rate) || 0;
  const totalBonuses = parseInt(user.total_bonuses) || 0;
  const depositAmount = parseFloat(user.total_deposit_amount) || 0;
  const wagerAmount = parseFloat(user.total_wagered) || 0;

  // ========== CHURN RISK CALCULATION ==========

  // 1. Game Activity Analysis (40 points max)
  if (daysSinceLastGame >= CHURN_THRESHOLDS.activity.critical) {
    churnScore += 40;
    riskFactors.push(`🔴 No game activity for ${daysSinceLastGame.toFixed(0)} days`);
    playerStatus = "Churned";
  } else if (daysSinceLastGame >= CHURN_THRESHOLDS.activity.warning) {
    churnScore += 25;
    riskFactors.push(`🟡 Inactive for ${daysSinceLastGame.toFixed(0)} days`);
    playerStatus = "At Risk";
  } else if (daysSinceLastGame >= CHURN_THRESHOLDS.activity.safe) {
    churnScore += 10;
    riskFactors.push(`🟠 ${daysSinceLastGame.toFixed(0)} days since last game`);
  }

  // 2. Recent Engagement (20 points max)
  if (gamesLast7Days === 0 && totalGames > 0) {
    churnScore += 15;
    riskFactors.push("🔴 Zero games in last 7 days");
  }
  if (gamesLast30Days === 0 && totalGames > 0) {
    churnScore += 20;
    riskFactors.push("🔴 Zero games in last 30 days");
    playerStatus = "Dormant";
  } else if (gamesLast30Days < CHURN_THRESHOLDS.engagement.low_games && totalGames > 50) {
    churnScore += 10;
    riskFactors.push(`🟡 Only ${gamesLast30Days} games in 30 days`);
  }

  // 3. Deposit Behavior (25 points max)
  if (totalDeposits === 0 && totalGames > 100) {
    churnScore += 20;
    riskFactors.push("🔴 Never deposited (free player)");
    retentionActions.push("💰 First deposit bonus: 200% + 100 free spins");
  } else if (daysSinceDeposit >= CHURN_THRESHOLDS.deposit.inactive) {
    churnScore += 25;
    riskFactors.push(`🔴 ${daysSinceDeposit.toFixed(0)} days since last deposit`);
    retentionActions.push("💳 Reload bonus: 150% up to $500");
  } else if (daysSinceDeposit >= CHURN_THRESHOLDS.deposit.declining) {
    churnScore += 15;
    riskFactors.push(`🟡 ${daysSinceDeposit.toFixed(0)} days since deposit`);
    retentionActions.push("💰 Win-back offer: 50 free spins");
  }

  // 4. Bonus Engagement (15 points max)
  if (bonusCancelRate >= CHURN_THRESHOLDS.bonus.high_cancel && totalBonuses > 5) {
    churnScore += 15;
    riskFactors.push(`🟡 High bonus cancel rate (${bonusCancelRate.toFixed(0)}%)`);
    retentionActions.push("🎁 No-wagering cashback offers");
  }
  if (bonusCompletionRate === CHURN_THRESHOLDS.bonus.zero_completion && totalBonuses > 3) {
    churnScore += 10;
    riskFactors.push("🔴 Never completed any bonus");
  }

  // 5. Account Lifecycle
  const accountAge = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
  if (accountAge < 30 && totalGames < 10) {
    churnScore += 10;
    riskFactors.push("🔴 New user, low engagement");
    retentionActions.push("👋 Welcome campaign: Daily login rewards");
  }

  // ========== CHURN RISK LEVEL ==========
  churnProbability = Math.min(churnScore, 100);

  if (churnScore >= 60) {
    churnRisk = "🔴 High";
  } else if (churnScore >= 30) {
    churnRisk = "🟡 Medium";
  } else if (churnScore >= 15) {
    churnRisk = "🟠 Low-Medium";
  } else {
    churnRisk = "🟢 Low";
  }

  // ========== RETENTION STRATEGY ==========
  if (playerStatus === "Churned") {
    retentionActions.push("🚨 Urgent: High-value reactivation offer");
    retentionActions.push("📧 Email: 'We miss you - $50 bonus inside'");
  } else if (playerStatus === "At Risk") {
    retentionActions.push("⚠️ Priority: Engagement campaign");
    retentionActions.push("🎮 Promote favorite games");
  } else if (playerStatus === "Dormant") {
    retentionActions.push("💤 Wake-up: 100 free spins + $20 bonus");
  }

  if (depositAmount > 500 && churnScore > 40) {
    retentionActions.push("💎 VIP intervention: Personal account manager");
  }

  if (riskFactors.length === 0) {
    riskFactors.push("✅ Active and engaged");
    playerStatus = "Active";
  }

  // Only include users with meaningful data
  if (totalGames > 0 || totalDeposits > 0 || totalBonuses > 0) {
    results.push({
      // User Info
      user_id: user.id,
      email: user.email,
      name: (user.first_name || "") + " " + (user.last_name || ""),
      country: user.country,
      created_at: user.created_at,
      account_age_days: accountAge,

      // Churn Prediction
      churn_risk: churnRisk,
      churn_score: churnProbability,
      churn_probability: `${churnProbability}%`,
      player_status: playerStatus,
      risk_factors: riskFactors,
      retention_actions: retentionActions,

      // Activity Metrics
      days_since_last_game: daysSinceLastGame === 999 ? "Never" : daysSinceLastGame.toFixed(0),
      days_since_last_deposit: daysSinceDeposit === 999 ? "Never" : daysSinceDeposit.toFixed(0),
      games_last_7_days: gamesLast7Days,
      games_last_30_days: gamesLast30Days,
      total_games: totalGames,

      // Financial Metrics
      total_deposits: totalDeposits,
      total_deposit_amount: depositAmount.toFixed(2),
      total_wagered: wagerAmount.toFixed(2),
      
      // Bonus Behavior
      total_bonuses: totalBonuses,
      bonus_cancel_rate: bonusCancelRate.toFixed(1) + "%",
      bonus_completion_rate: bonusCompletionRate.toFixed(1) + "%",

      // Status
      kyc_status: user.kyc_status,
      is_vip: user.is_vip ? "Yes" : "No"
    });
  }
}

// Sort by churn score (highest risk first)
results.sort((a, b) => b.churn_score - a.churn_score);

// Calculate distribution
const riskDistribution = results.reduce((acc, u) => {
  acc[u.churn_risk] = (acc[u.churn_risk] || 0) + 1;
  return acc;
}, {});

const statusDistribution = results.reduce((acc, u) => {
  acc[u.player_status] = (acc[u.player_status] || 0) + 1;
  return acc;
}, {});

// Return results
return [{
  json: {
    analysis_date: new Date().toISOString().split('T')[0],
    total_users_analyzed: users.length,
    users_predicted: results.length,
    
    // Summary Statistics
    risk_distribution: riskDistribution,
    status_distribution: statusDistribution,
    high_risk_count: results.filter(u => u.churn_score >= 60).length,
    immediate_action_required: results.filter(u => u.player_status === "Churned" || u.churn_score >= 70).length,
    
    // Predicted Users (sorted by risk)
    predictions: results,
    
    // API Metadata & URLs
    url: $input.first().json.meta?.next_page_url || null,
    domain: $('Dynamically fetch the url,baseUrl,domain').first().json.domain,
    baseUrl: $('Dynamically fetch the url,baseUrl,domain').first().json.baseUrl
  }
}];
```

---

## 📄 FILE 2: `ML_summary.js`

```javascript
// ====================================================
// ML SUMMARY AGGREGATION
// ====================================================
// Purpose: Aggregates churn predictions and prepares data for database
// Input: Output from churn_ML.js
// Output: Summary statistics + formatted user records
// ====================================================

// ========== GET DATA FROM PREVIOUS NODE ==========
const inputData = $input.first().json;
const results = inputData.predictions || [];
const totalAnalyzed = inputData.total_users_analyzed || 0;

// ========== SUMMARY DATA FOR DATABASE ==========
const summaryData = {
  // Run Information
  analysis_id: `CHURN_${Date.now()}`, // Unique ID for this analysis run
  analysis_date: new Date().toISOString(),
  analyzed_at: new Date().toISOString().split('T')[0],
  
  // Overall Statistics
  total_users_analyzed: totalAnalyzed,
  total_users_predicted: results.length,
  
  // Risk Distribution
  high_risk_users: results.filter(u => u.churn_score >= 60).length,
  medium_risk_users: results.filter(u => u.churn_score >= 30 && u.churn_score < 60).length,
  low_risk_users: results.filter(u => u.churn_score < 30).length,
  
  // Status Distribution
  churned_users: results.filter(u => u.player_status === "Churned").length,
  at_risk_users: results.filter(u => u.player_status === "At Risk").length,
  dormant_users: results.filter(u => u.player_status === "Dormant").length,
  active_users: results.filter(u => u.player_status === "Active").length,
  
  // Critical Metrics
  immediate_action_required: results.filter(u => u.churn_score >= 70).length,
  users_inactive_60plus_days: results.filter(u => {
    const days = parseFloat(u.days_since_last_game);
    return days >= 60 && days !== 999 && !isNaN(days);
  }).length,
  users_no_deposit_90plus_days: results.filter(u => {
    const days = parseFloat(u.days_since_last_deposit);
    return days >= 90 && days !== 999 && !isNaN(days);
  }).length,
  
  // Value at Risk
  high_value_at_risk: results.filter(u => {
    const deposit = parseFloat(u.total_deposit_amount);
    return deposit > 500 && u.churn_score >= 40;
  }).length,
  
  total_deposit_at_risk: results
    .filter(u => u.churn_score >= 60)
    .reduce((sum, u) => sum + parseFloat(u.total_deposit_amount || 0), 0)
    .toFixed(2),
  
  // Retention Campaign Priorities
  urgent_reactivation_count: results.filter(u => u.player_status === "Churned").length,
  engagement_campaign_count: results.filter(u => u.player_status === "At Risk").length,
  dormant_wakeup_count: results.filter(u => u.player_status === "Dormant").length,
  vip_intervention_count: results.filter(u => {
    const deposit = parseFloat(u.total_deposit_amount);
    return deposit > 500 && u.churn_score > 40;
  }).length,
  
  // Average Metrics
  avg_churn_score: results.length > 0 
    ? (results.reduce((sum, u) => sum + u.churn_score, 0) / results.length).toFixed(2)
    : "0.00",
  avg_days_inactive: results.length > 0
    ? (results.reduce((sum, u) => {
        const days = parseFloat(u.days_since_last_game);
        return sum + (days === 999 || isNaN(days) ? 0 : days);
      }, 0) / results.length).toFixed(2)
    : "0.00",
  
  // Top Risk Factors (Cleaned - most common)
  top_risk_factors: Object.entries(
    results
      .flatMap(u => u.risk_factors || [])
      .map(f => f.replace(/[🔴🟡🟠✅]/g, '').trim())
      .reduce((acc, factor) => {
        if (factor) acc[factor] = (acc[factor] || 0) + 1;
        return acc;
      }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([factor, count]) => `${factor} (${count} users)`)
    .join('; '),
  
  // Data Source
  data_source: "API /v2/ml/churns",
  domain: inputData.domain || "N/A",
  baseUrl: inputData.baseUrl || "N/A"
};

// ========== DATABASE SAVE FORMAT ==========
const databaseRecord = {
  // Primary Key
  id: summaryData.analysis_id,
  
  // Timestamps
  created_at: summaryData.analysis_date,
  analyzed_date: summaryData.analyzed_at,
  
  // Counts
  total_analyzed: summaryData.total_users_analyzed,
  total_predicted: summaryData.total_users_predicted,
  
  // Risk Levels
  high_risk_count: summaryData.high_risk_users,
  medium_risk_count: summaryData.medium_risk_users,
  low_risk_count: summaryData.low_risk_users,
  
  // Player Status
  churned_count: summaryData.churned_users,
  at_risk_count: summaryData.at_risk_users,
  dormant_count: summaryData.dormant_users,
  active_count: summaryData.active_users,
  
  // Critical Alerts
  urgent_action_count: summaryData.immediate_action_required,
  high_value_risk_count: summaryData.high_value_at_risk,
  
  // Financial Impact
  total_deposit_at_risk: summaryData.total_deposit_at_risk,
  
  // Averages
  avg_churn_score: summaryData.avg_churn_score,
  avg_days_inactive: summaryData.avg_days_inactive,
  
  // Campaign Priorities (Flat Structure)
  urgent_reactivation_count: summaryData.urgent_reactivation_count,
  engagement_campaign_count: summaryData.engagement_campaign_count,
  dormant_wakeup_count: summaryData.dormant_wakeup_count,
  vip_intervention_count: summaryData.vip_intervention_count,
  
  // Top Risk Factors (Clean Text)
  top_risk_factors: summaryData.top_risk_factors,
  
  // Metadata
  data_source: summaryData.data_source,
  domain: summaryData.domain,
  base_url: summaryData.baseUrl
};

// ========== PREPARE USER DATA FOR DATABASE (IMPORTANT COLUMNS ONLY) ==========
const userChurnData = results.map(user => {
  // Clean risk factors - remove emojis and format nicely
  const cleanRiskFactors = (user.risk_factors || [])
    .map(factor => factor.replace(/[🔴🟡🟠✅]/g, '').trim())
    .join('; ');
  
  // Clean retention actions - remove emojis and format nicely
  const cleanRetentionActions = (user.retention_actions || [])
    .map(action => action.replace(/[💰💳🔥🎁🏆🎮🚨📧⚠️💤💎👋]/g, '').trim())
    .join('; ');

  return {
    // ✅ ADD METADATA TO EACH USER (IMPORTANT!)
    url: inputData.url,
    domain: inputData.domain,
    baseUrl: inputData.baseUrl,
    
    // User Identity
    user_id: user.user_id,
    email: user.email,
    country: user.country,
    
    // Churn Prediction (Core)
    churn_risk_level: user.churn_risk.replace(/[🔴🟡🟠🟢]/g, '').trim(),
    churn_score: user.churn_score,
    player_status: user.player_status,
    
    // Risk Analysis (Cleaned)
    risk_factors: cleanRiskFactors || null,
    retention_actions: cleanRetentionActions || null,
    
    // Activity Metrics (Key Indicators)
    days_since_last_game: user.days_since_last_game === "Never" ? 999 : parseFloat(user.days_since_last_game),
    days_since_last_deposit: user.days_since_last_deposit === "Never" ? 999 : parseFloat(user.days_since_last_deposit),
    games_last_7_days: user.games_last_7_days,
    games_last_30_days: user.games_last_30_days,
    total_games: user.total_games,
    
    // Financial Data (Revenue Impact)
    total_deposits: user.total_deposits,
    total_deposit_amount: parseFloat(user.total_deposit_amount || 0),
    total_wagered: parseFloat(user.total_wagered || 0),
    
    // Bonus Behavior (Engagement Indicator)
    total_bonuses: user.total_bonuses,
    bonus_cancel_rate: parseFloat(user.bonus_cancel_rate || 0),
    bonus_completion_rate: parseFloat(user.bonus_completion_rate || 0),
    
    // Account Info
    account_age_days: user.account_age_days,
    kyc_status: user.kyc_status,
    is_vip: user.is_vip === "Yes" ? true : false,  // ✅ Convert to boolean
    
    // Timestamps
    analyzed_at: summaryData.analyzed_at,
    analysis_id: summaryData.analysis_id,
    created_at: new Date().toISOString()
  };
});

// ✅ RETURN FORMAT - Keep everything for flexibility
return {
  summary: summaryData,
  database_record: databaseRecord,
  user_churn_predictions: userChurnData,
  total_user_records: userChurnData.length,
  url: inputData.url || null,
  domain: inputData.domain || null,
  baseUrl: inputData.baseUrl || null
};
```

---

## 📄 FILE 3: `config.js`

```javascript
// ====================================================
// CONFIGURATION FILE
// ====================================================

module.exports = {
  // API Configuration
  API: {
    ENDPOINT: '/v2/ml/churns',
    TIMEOUT: 30000,
    RETRY_COUNT: 3
  },

  // Churn Thresholds (can be tuned)
  THRESHOLDS: {
    ACTIVITY_CRITICAL: 60,    // Days
    ACTIVITY_WARNING: 30,     // Days
    ACTIVITY_SAFE: 7,         // Days
    DEPOSIT_INACTIVE: 90,     // Days
    DEPOSIT_DECLINING: 45,    // Days
    LOW_GAMES: 10,            // Count
    HIGH_BONUS_CANCEL: 70,    // Percentage
  },

  // Scoring Weights
  WEIGHTS: {
    GAME_ACTIVITY: 40,
    RECENT_ENGAGEMENT: 20,
    DEPOSIT_BEHAVIOR: 25,
    BONUS_ENGAGEMENT: 15,
    ACCOUNT_LIFECYCLE: 10
  },

  // Risk Levels
  RISK_LEVELS: {
    HIGH: 60,           // Score >= 60
    MEDIUM: 30,         // Score >= 30
    LOW_MEDIUM: 15,     // Score >= 15
    LOW: 0              // Score < 15
  },

  // Database Tables
  DATABASE: {
    SUMMARY_TABLE: 'churn_summary',
    PREDICTIONS_TABLE: 'user_churn_predictions'
  },

  // Retention Offers
  RETENTION_OFFERS: {
    FIRST_DEPOSIT: "200% + 100 free spins",
    RELOAD_BONUS: "150% up to $500",
    WINBACK_OFFER: "50 free spins",
    CASHBACK: "No-wagering cashback offers",
    VIP_INTERVENTION: "Personal account manager",
    WELCOME_CAMPAIGN: "Daily login rewards",
    DORMANT_WAKEUP: "100 free spins + $20 bonus",
    URGENT_REACTIVATION: "$50 bonus inside"
  }
};
```
