import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  Play,
  Terminal,
  Layers,
  BookOpen,
  Award,
  Zap,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Challenge, ChallengeDimension, ChallengeType } from '../../types/challenge';

interface ChallengeHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: Challenge[];
  currentChallengeId: string;
  completedIds: string[];
  onSelectChallenge: (challenge: Challenge) => void;
}

export const ChallengeHubModal: React.FC<ChallengeHubModalProps> = ({
  isOpen,
  onClose,
  challenges,
  currentChallengeId,
  completedIds,
  onSelectChallenge,
}) => {
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const dimensionTabs = [
    { key: 'all', label: '全部维度' },
    { key: 'troubleshooting', label: '故障排查' },
    { key: 'services', label: '常见服务' },
    { key: 'core_tools', label: '核心工具' },
    { key: 'modern_devops', label: '现代DevOps' },
  ];

  const typeTabs = [
    { key: 'all', label: '全部题型' },
    { key: 'tutorial', label: '新手教学', icon: BookOpen },
    { key: 'war_room', label: '排障作战室', icon: Terminal },
    { key: 'terminal_lab', label: '终端实训', icon: Layers },
    { key: 'flashcard', label: '闪卡速记', icon: Sparkles },
  ];

  const filteredChallenges = challenges.filter((c) => {
    if (selectedDimension !== 'all' && c.dimension !== selectedDimension) return false;
    if (selectedType !== 'all' && c.type !== selectedType) return false;
    return true;
  });

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'L1_EASY':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">入门 L1</span>;
      case 'L2_MEDIUM':
        return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono">进阶 L2</span>;
      case 'L3_HARD':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono">专家 L3</span>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: ChallengeType) => {
    switch (type) {
      case 'tutorial':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'war_room':
        return <Terminal className="w-3.5 h-3.5 text-rose-400" />;
      case 'terminal_lab':
        return <Layers className="w-3.5 h-3.5 text-cyber-blue" />;
      case 'flashcard':
        return <Sparkles className="w-3.5 h-3.5 text-cyber-purple" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="w-full max-w-4xl h-[90vh] sm:h-[720px] bg-slate-900 border border-slate-700/80 rounded-3xl flex flex-col shadow-2xl overflow-hidden"
          >
            {/* 头部标题与统计 */}
            <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyber-blue to-cyber-purple flex items-center justify-center text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white">运维实战题库大厅</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 font-mono">
                      已通关 {completedIds.length}/{challenges.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">选择关卡进入实战排错或闪卡强化训练</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 筛选标签条 */}
            <div className="p-3 sm:px-5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap gap-2 items-center justify-between shrink-0">
              {/* 维度筛选 */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
                {dimensionTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedDimension(tab.key)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedDimension === tab.key
                        ? 'bg-cyber-blue text-slate-950 font-bold shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 题型筛选 */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
                {typeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedType(tab.key)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedType === tab.key
                        ? 'bg-cyber-purple text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 关卡网格展示区 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredChallenges.map((c) => {
                const isCompleted = completedIds.includes(c.id);
                const isCurrent = currentChallengeId === c.id;

                return (
                  <motion.div
                    key={c.id}
                    whileHover={{ scale: 1.01 }}
                    className={`rounded-2xl p-4 border flex flex-col justify-between transition-all relative overflow-hidden ${
                      isCurrent
                        ? 'bg-slate-800/90 border-cyber-blue/70 shadow-[0_0_20px_rgba(56,189,248,0.15)] ring-1 ring-cyber-blue/50'
                        : isCompleted
                        ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-500/60'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* 卡片头部 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          {getTypeIcon(c.type)}
                          <span className="font-mono uppercase text-[11px]">{c.type.replace('_', ' ')}</span>
                          <span>·</span>
                          {getDifficultyBadge(c.difficulty)}
                        </div>

                        {/* 状态徽标 */}
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyber-green bg-cyber-green/10 px-2 py-0.5 rounded-full border border-cyber-green/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            已通关
                          </span>
                        )}
                        {isCurrent && !isCompleted && (
                          <span className="text-[11px] font-mono text-cyber-blue bg-cyber-blue/10 px-2 py-0.5 rounded-full border border-cyber-blue/30 animate-pulse">
                            挑战中
                          </span>
                        )}
                      </div>

                      {/* 关卡标题与简介 */}
                      <h3 className="font-bold text-white text-sm sm:text-base mb-1.5 flex items-center gap-1.5">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                        {c.tagline}
                      </p>
                    </div>

                    {/* 卡片底部收益与开始按钮 */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-amber-400 font-mono font-semibold">
                          <Zap className="w-3.5 h-3.5" />
                          +{c.rewardExp} EXP
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {Object.entries(c.rewardRadar)
                            .map(([k, v]) => `${k}+${v}`)
                            .join(' ')}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          onSelectChallenge(c);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                          isCurrent
                            ? 'bg-slate-700 text-slate-300 hover:text-white'
                            : 'bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue border border-cyber-blue/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                        }`}
                      >
                        <Play className="w-3 h-3" />
                        <span>{isCurrent ? '继续实战' : isCompleted ? '再次复习' : '开始挑战'}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
