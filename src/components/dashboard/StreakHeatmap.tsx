import React from 'react';
import { Flame } from 'lucide-react';

interface StreakHeatmapProps {
  currentStreak: number;
  activityDates?: string[];
}

export const StreakHeatmap: React.FC<StreakHeatmapProps> = ({
  currentStreak,
  activityDates = [],
}) => {
  // 生成最近 5 周 (35 天) 的真实日期方格
  const days = 35;
  const now = new Date();

  const activityData = Array.from({ length: days }, (_, i) => {
    // 逆推过去 35 天的日期
    const d = new Date(now);
    d.setDate(now.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split('T')[0];

    const isDone = activityDates.includes(dateStr);
    // 如果当天完成，根据是否为连续打卡范围内给予高亮
    let level = 0;
    if (isDone) {
      level = 3;
    } else if (i >= days - currentStreak && currentStreak > 0) {
      level = 2;
    }

    return { dayIndex: i, dateStr, level };
  });

  const getCellColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-slate-800/80 border border-slate-700/30';
      case 1:
        return 'bg-emerald-950/80 border border-emerald-900/50';
      case 2:
        return 'bg-emerald-700/80 border border-emerald-600/60';
      case 3:
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] border border-emerald-300';
      default:
        return 'bg-slate-800';
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>连续打卡</span>
          <span className="text-amber-400 font-mono font-bold">{currentStreak} 天</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">近 5 周运维实训</span>
      </div>

      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {activityData.map((d, idx) => (
          <div
            key={idx}
            className={`w-3 h-3 rounded-sm ${getCellColor(d.level)} transition-colors cursor-pointer`}
            title={`${d.dateStr}: ${d.level > 0 ? '已打卡' : '未打卡'}`}
          />
        ))}
      </div>
    </div>
  );
};

