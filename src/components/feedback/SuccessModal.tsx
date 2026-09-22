import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Zap, ArrowRight, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { Challenge } from '../../types/challenge';

interface SuccessModalProps {
  isOpen: boolean;
  challenge: Challenge;
  isLevelUp?: boolean;
  onNext: () => void;
  onReplay: () => void;
  hasNextChallenge?: boolean;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  challenge,
  isLevelUp = false,
  onNext,
  onReplay,
  hasNextChallenge = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      // 触发微粒子欢庆烟花
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#10B981', '#38BDF8', '#8B5CF6', '#F59E0B'],
      });
    }
  }, [isOpen]);

  const radarGainsText = Object.entries(challenge.rewardRadar || {})
    .map(([k, v]) => {
      const labelMap: Record<string, string> = {
        kernel: '内核',
        network: '网络',
        storage: '存储',
        container: '容器',
        troubleshooting: '排错',
        security: '安全',
      };
      return `${labelMap[k] || k} +${v}`;
    })
    .join(' · ');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-cyber-green/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center relative overflow-hidden"
          >
            {/* 顶部荣誉徽标 */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-cyber-green/20 border border-cyber-green/60 flex items-center justify-center text-cyber-green mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Trophy className="w-9 h-9" />
            </div>

            <div className="inline-block px-2.5 py-0.5 rounded-full bg-cyber-green/10 border border-cyber-green/30 text-cyber-green text-xs font-mono font-semibold mb-2">
              MISSION ACCOMPLISHED
            </div>

            <h2 className="text-xl font-bold text-white mb-1">实战挑战成功！</h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              恭喜攻克【{challenge.title}】，实战经验与战力模型已同步持久化更新！
            </p>

            {/* 升级提示 */}
            {isLevelUp && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mb-4 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-cyber-purple/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>恭喜！工程师技术等级提升！</span>
              </motion.div>
            )}

            {/* 成长数值结算卡 */}
            <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/80 mb-5 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  获得经验值 (EXP)
                </span>
                <span className="text-cyber-green font-mono font-bold">+{challenge.rewardExp} EXP</span>
              </div>
              {radarGainsText && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyber-blue" />
                    六维战力提升
                  </span>
                  <span className="text-cyber-blue font-mono font-bold">{radarGainsText}</span>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2.5">
              <button
                onClick={onReplay}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重放复训</span>
              </button>
              <button
                onClick={onNext}
                className="flex-[1.5] py-2.5 rounded-xl bg-cyber-green text-slate-950 font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                <span>{hasNextChallenge ? '下一关卡' : '关卡大厅'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

