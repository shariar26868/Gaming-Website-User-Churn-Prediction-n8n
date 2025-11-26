



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