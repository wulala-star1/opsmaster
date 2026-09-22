import { UserStats, RadarMetrics } from '../types/challenge';

const STORAGE_KEY_USER_STATS = 'opsmaster_user_stats';

export const defaultRadarMetrics: RadarMetrics = {
  kernel: 45,
  network: 55,
  storage: 30,
  container: 40,
  troubleshooting: 50,
  security: 35,
};

export const defaultUserStats: UserStats = {
  level: 1,
  exp: 0,
  currentStreak: 1,
  completedChallengeIds: [],
  activityDates: [new Date().toISOString().split('T')[0]],
  radar: defaultRadarMetrics,
};

/**
 * 计算等级：每 200 经验升一级
 */
export function calculateLevel(exp: number): number {
  return Math.floor(exp / 200) + 1;
}

/**
 * 加载持久化的用户战力与实训状态
 */
export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_STATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultUserStats,
        ...parsed,
        radar: { ...defaultRadarMetrics, ...(parsed.radar || {}) },
        completedChallengeIds: parsed.completedChallengeIds || [],
        activityDates: parsed.activityDates || [new Date().toISOString().split('T')[0]],
      };
    }
  } catch (e) {
    console.error('Failed to load user stats from localStorage', e);
  }
  return defaultUserStats;
}

/**
 * 保存用户战力与实训状态
 */
export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER_STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user stats to localStorage', e);
  }
}

/**
 * 完成关卡结算：增加 EXP、更新雷达属性、记录完成状态、打卡
 */
export function recordChallengeCompleted(
  challengeId: string,
  rewardExp: number,
  rewardRadar: Partial<RadarMetrics>
): { updatedStats: UserStats; isLevelUp: boolean } {
  const current = loadUserStats();
  const today = new Date().toISOString().split('T')[0];

  const alreadyCompleted = current.completedChallengeIds.includes(challengeId);
  const newCompletedIds = alreadyCompleted
    ? current.completedChallengeIds
    : [...current.completedChallengeIds, challengeId];

  // 经验累加 (重复刷同一关卡获得 50% 基础经验)
  const actualExpGain = alreadyCompleted ? Math.round(rewardExp * 0.5) : rewardExp;
  const newExp = current.exp + actualExpGain;
  const oldLevel = current.level;
  const newLevel = calculateLevel(newExp);
  const isLevelUp = newLevel > oldLevel;

  // 雷达点数提升（满分 100）
  const newRadar: RadarMetrics = { ...current.radar };
  for (const [key, inc] of Object.entries(rewardRadar)) {
    const k = key as keyof RadarMetrics;
    if (typeof inc === 'number') {
      const actualInc = alreadyCompleted ? Math.ceil(inc * 0.5) : inc;
      newRadar[k] = Math.min(100, (newRadar[k] || 0) + actualInc);
    }
  }

  // 维护打卡日期
  const newDates = current.activityDates.includes(today)
    ? current.activityDates
    : [...current.activityDates, today];

  // 连续打卡天数计算
  let newStreak = current.currentStreak;
  if (!current.activityDates.includes(today)) {
    newStreak += 1;
  }

  const updated: UserStats = {
    ...current,
    level: newLevel,
    exp: newExp,
    currentStreak: newStreak,
    completedChallengeIds: newCompletedIds,
    activityDates: newDates,
    radar: newRadar,
  };

  saveUserStats(updated);
  return { updatedStats: updated, isLevelUp };
}

/**
 * 重置用户所有学习与通关数据
 */
export function resetUserStats(): UserStats {
  const resetStats: UserStats = {
    ...defaultUserStats,
    activityDates: [new Date().toISOString().split('T')[0]],
  };
  saveUserStats(resetStats);
  return resetStats;
}
