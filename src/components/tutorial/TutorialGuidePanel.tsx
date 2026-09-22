import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  CornerDownLeft,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles,
  Play,
  Terminal,
} from 'lucide-react';
import { TutorialStep } from '../../types/challenge';

interface TutorialGuidePanelProps {
  steps: TutorialStep[];
  objectiveStates: boolean[];
  onFillCommand: (cmd: string) => void;
}

export const TutorialGuidePanel: React.FC<TutorialGuidePanelProps> = ({
  steps,
  objectiveStates,
  onFillCommand,
}) => {
  // 默认展开当前正在进行的步骤（首个未完成的步骤）
  const firstUnfinishedIdx = objectiveStates.findIndex((st) => !st);
  const activeStepIdx = firstUnfinishedIdx === -1 ? steps.length - 1 : firstUnfinishedIdx;
  const [expandedIndices, setExpandedIndices] = useState<number[]>([activeStepIdx >= 0 ? activeStepIdx : 0]);

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const completedCount = objectiveStates.filter(Boolean).length;

  return (
    <div className="space-y-3 select-none text-xs">
      {/* 教学向导顶部提示条 */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/30 text-amber-300">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold text-white">手把手保姆级教学向导</span>
        </div>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
          进度 {completedCount}/{steps.length}
        </span>
      </div>

      {/* 步骤列表 */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const isDone = objectiveStates[idx] || false;
          const isCurrent = idx === activeStepIdx && !isDone;
          const isExpanded = expandedIndices.includes(idx) || isCurrent;

          return (
            <motion.div
              key={idx}
              initial={false}
              className={`rounded-xl border transition-all overflow-hidden ${
                isDone
                  ? 'bg-slate-900/60 border-cyber-green/40'
                  : isCurrent
                  ? 'bg-slate-900/90 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/40'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
              }`}
            >
              {/* 步骤折叠头部 */}
              <div
                onClick={() => toggleExpand(idx)}
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-cyber-green shrink-0" />
                  ) : isCurrent ? (
                    <span className="w-4 h-4 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center text-[10px] text-amber-400 font-bold shrink-0 animate-pulse">
                      {idx + 1}
                    </span>
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  <span className={`font-semibold truncate text-xs ${isDone ? 'text-emerald-300' : isCurrent ? 'text-white' : 'text-slate-400'}`}>
                    步骤 {idx + 1}：{step.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                  {isCurrent && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      当前步
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* 展开的教学详情 */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pb-3 pt-1 border-t border-slate-800/60 space-y-2.5 text-xs text-slate-300 leading-relaxed"
                  >
                    {/* 1. 底层原理科普 */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="text-[11px] font-semibold text-cyber-blue flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-cyber-blue" />
                        <span>排查依据与底层原理：</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {step.conceptExplanation}
                      </p>
                    </div>

                    {/* 2. 推荐执行命令与一键填入 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>推荐执行指令：</span>
                        <span className="text-[10px] text-slate-500 font-mono">点击直接填入终端</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                        <code className="text-cyber-green truncate flex-1 select-all">
                          {step.recommendedCommand}
                        </code>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onFillCommand(step.recommendedCommand);
                          }}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue border border-cyber-blue/40 text-[11px] font-sans font-semibold transition-all shadow-sm"
                          title="将命令一键填入下方终端并聚焦"
                        >
                          <Terminal className="w-3 h-3" />
                          <span>填入终端</span>
                        </motion.button>
                      </div>
                    </div>

                    {/* 3. 参数逐项拆解说明 (若有) */}
                    {step.commandBreakdown && step.commandBreakdown.length > 0 && (
                      <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60 space-y-1 text-[11px]">
                        <span className="font-semibold text-slate-400">参数逐一拆解：</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-0.5">
                          {step.commandBreakdown.map((item, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-1 font-mono text-[10px]">
                              <span className="px-1 py-0.2 rounded bg-slate-800 text-cyber-blue font-bold">
                                {item.flag}
                              </span>
                              <span className="text-slate-400 font-sans">{item.meaning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. 关键输出特征解读 */}
                    <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2 rounded-lg border border-slate-700/50 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-200">终端输出观察点：</strong>
                        {step.expectedResultHint}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
