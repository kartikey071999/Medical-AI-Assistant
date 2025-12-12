import { DailyLogEntry, RiskAssessment } from '../types';

export const calculateHealthRisks = (logs: DailyLogEntry[]): RiskAssessment[] => {
  if (logs.length === 0) return [];

  const last7Days = logs.slice(0, 7);
  const avg = (key: keyof DailyLogEntry) => {
    const validLogs = last7Days.filter(l => l[key] !== undefined);
    if (validLogs.length === 0) return 0;
    return validLogs.reduce((acc, l) => acc + (l[key] as number), 0) / validLogs.length;
  };

  const avgStress = avg('stress');
  const avgSleepQuality = avg('sleepQuality');
  const avgSleepHours = avg('sleepHours') || 7; // Default to 7 if not logged
  const avgEnergy = avg('energy');
  const avgMood = avg('mood');

  const risks: RiskAssessment[] = [];

  // 1. Stress Risk
  const stressScore = (avgStress / 5) * 100;
  risks.push({
    title: 'Chronic Stress Risk',
    score: Math.round(stressScore),
    level: stressScore > 80 ? 'Severe' : stressScore > 60 ? 'High' : stressScore > 40 ? 'Moderate' : 'Low',
    description: `Your recent stress levels average ${avgStress.toFixed(1)}/5.`,
    suggestions: stressScore > 60 
      ? ['Practice 4-7-8 breathing', 'Reduce caffeine intake', 'Schedule 15min downtime'] 
      : ['Maintain current balance', 'Regular exercise']
  });

  // 2. Sleep Deprivation Risk
  // Ideal sleep: 7-9 hours. 
  // Risk formula: penalize deviation from 7.5. Penalize low quality.
  const hoursPenalty = Math.max(0, (7.5 - avgSleepHours) * 20); // 20 pts per hour lost
  const qualityPenalty = Math.max(0, (5 - avgSleepQuality) * 10);
  const sleepRiskScore = Math.min(100, hoursPenalty + qualityPenalty);
  
  risks.push({
    title: 'Sleep Deprivation',
    score: Math.round(sleepRiskScore),
    level: sleepRiskScore > 75 ? 'Severe' : sleepRiskScore > 50 ? 'High' : sleepRiskScore > 25 ? 'Moderate' : 'Low',
    description: `Averaging ${avgSleepHours.toFixed(1)} hours at ${avgSleepQuality.toFixed(1)}/5 quality.`,
    suggestions: sleepRiskScore > 50
      ? ['Set a strict bedtime', 'Avoid screens 1h before bed', 'Keep room cool']
      : ['Good sleep hygiene detected']
  });

  // 3. Burnout Likelihood
  // High Stress + Low Energy + Low Mood
  const burnoutScore = ((avgStress + (6 - avgEnergy) + (6 - avgMood)) / 15) * 100;
  
  risks.push({
    title: 'Burnout Likelihood',
    score: Math.round(burnoutScore),
    level: burnoutScore > 70 ? 'High' : burnoutScore > 40 ? 'Moderate' : 'Low',
    description: 'Based on combined stress, energy, and mood patterns.',
    suggestions: burnoutScore > 50 
      ? ['Prioritize rest immediately', 'Delegate tasks if possible', 'Seek social support']
      : ['Energy levels look sustainable']
  });

  return risks;
};

// Helper to format data for PDF
export const formatMonthlyData = (logs: DailyLogEntry[], risks: RiskAssessment[]) => {
  const avgSteps = logs.reduce((acc, l) => acc + (l.steps || 0), 0) / (logs.length || 1);
  return {
    month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    totalLogs: logs.length,
    avgSteps: Math.round(avgSteps),
    risks
  };
};
