import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Challenge } from '../../types/challenge';

interface FlashcardLabProps {
  challenge: Challenge;
  onPass: () => void;
  onAskAI: (prompt: string) => void;
}

export const FlashcardLab: React.FC<FlashcardLabProps> = ({
  challenge,
  onPass,
  onAskAI,
}) => {
  const data = challenge.flashcardData;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        该关卡未配置闪卡数据。
      </div>
    );
  }

  const handleSubmit = () => {
    if (!selectedKey || isSubmitted) return;
    const correct = selectedKey === data.correctAnswer;
    setIsSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      setTimeout(() => {
        onPass();
      }, 1200);
    }
  };

  const handleReset = () => {
    setSelectedKey(null);
    setIsSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden"
      >
        {/* 顶部标签 */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-purple animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-cyber-purple uppercase">
              运维核心概念闪卡速记 · {challenge.difficulty}
            </span>
          </div>
          <button
            onClick={() => onAskAI(`请用苏格拉底提问启发我思考：${data.question}`)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyber-purple transition-colors bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60"
          >
            <Sparkles className="w-3 h-3 text-cyber-purple" />
            <span>AI 思路启发</span>
          </button>
        </div>

        {/* 实战背景场景 */}
        {data.scenario && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-cyber-blue shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">实战场景：</span>
              <span>{data.scenario}</span>
            </div>
          </div>
        )}

        {/* 核心问题 */}
        <h3 className="text-sm sm:text-base font-bold text-white mb-5 leading-snug">
          {data.question}
        </h3>

        {/* 选项列表 */}
        <div className="space-y-2.5 mb-6">
          {data.options.map((opt) => {
            const isSelected = selectedKey === opt.key;
            let borderStyle = 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300';

            if (isSubmitted) {
              if (opt.key === data.correctAnswer) {
                borderStyle = 'border-cyber-green bg-cyber-green/15 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]';
              } else if (isSelected && !isCorrect) {
                borderStyle = 'border-rose-500 bg-rose-500/15 text-rose-200';
              }
            } else if (isSelected) {
              borderStyle = 'border-cyber-blue bg-cyber-blue/15 text-white shadow-[0_0_12px_rgba(56,189,248,0.25)]';
            }

            return (
              <motion.button
                key={opt.key}
                whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                onClick={() => !isSubmitted && setSelectedKey(opt.key)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 select-none text-xs sm:text-sm ${borderStyle}`}
              >
                <span className="w-6 h-6 rounded-lg bg-slate-800/90 border border-slate-700/80 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  {opt.key}
                </span>
                <span className="leading-relaxed flex-1">{opt.text}</span>
                {isSubmitted && opt.key === data.correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-cyber-green shrink-0 mt-0.5" />
                )}
                {isSubmitted && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 提交与重置按钮 */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            {selectedKey ? `已选: ${selectedKey}` : '请点击选择一个最符合生产实践的答案'}
          </div>

          <div className="flex items-center gap-2">
            {isSubmitted && !isCorrect && (
              <button
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新作答</span>
              </button>
            )}

            {!isSubmitted && (
              <button
                onClick={handleSubmit}
                disabled={!selectedKey}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyber-purple to-indigo-600 text-white text-xs font-bold disabled:opacity-40 transition-all shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:brightness-110 flex items-center gap-1.5"
              >
                <span>提交判题</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 答题反馈与深度解析 */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-5 pt-4 border-t border-slate-800 space-y-3"
            >
              <div
                className={`p-3 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                  isCorrect
                    ? 'bg-cyber-green/10 border-cyber-green/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-cyber-green shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold mb-1">
                    {isCorrect ? '回答完全正确！经验与战力已结算' : '回答有误，请分析排查'}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{data.explanation}</p>
                </div>
              </div>

              {/* 核心记忆口诀 */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">生产实战心法：</span>
                  <span>{data.keyTakeaway}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
