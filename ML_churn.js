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