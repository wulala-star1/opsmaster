import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal as TerminalIcon,
  Bot,
  Flame,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  HelpCircle,
  Layers,
  BarChart3,
  BookOpen,
  Sparkles,
  LayoutGrid,
  RotateCcw,
  Zap,
} from 'lucide-react';

import { challenges } from './mock/challengeData';
import { MockTerminalEngine } from './lib/mockTerminalEngine';
import { Challenge, TerminalLogEntry, UserStats } from './types/challenge';
import { TerminalShell } from './components/terminal/TerminalShell';
import { FlashcardLab } from './components/flashcard/FlashcardLab';
import { ChallengeHubModal } from './components/challenge/ChallengeHubModal';
import { AIMentorSheet } from './components/ai/AIMentorSheet';
import { SuccessModal } from './components/feedback/SuccessModal';
import { HexagonRadar } from './components/dashboard/HexagonRadar';
import { StreakHeatmap } from './components/dashboard/StreakHeatmap';
import { loadUserStats, recordChallengeCompleted } from './services/storageService';

// 导入教学向导组件
import { TutorialGuidePanel } from './components/tutorial/TutorialGuidePanel';

export function App() {
  // 1. 关卡状态
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(() => challenges[0]);
  const [isChallengeHubOpen, setIsChallengeHubOpen] = useState(false);
  const [modeTab, setModeTab] = useState<'challenge' | 'tutorial'>('challenge');
  const [injectedCommand, setInjectedCommand] = useState<string | undefined>();

  // 2. 持久化战力与实训状态
  const [userStats, setUserStats] = useState<UserStats>(() => loadUserStats());
  const [isLevelUp, setIsLevelUp] = useState(false);

  // 3. 沙箱引擎状态
  const [engine, setEngine] = useState(() => new MockTerminalEngine(currentChallenge));
  const [currentDir, setCurrentDir] = useState(() => engine.getCurrentDirectory());
  const [logs, setLogs] = useState<TerminalLogEntry[]>(() => [
    {
      id: 'welcome-1',
      output: `╔════════════════════════════════════════════════════════════════════╗\n║  OpsMaster 虚拟实操沙箱已就绪 · Alpine Linux 3.19 (x86_64)         ║\n║  关卡：${currentChallenge.title}                     ║\n╚════════════════════════════════════════════════════════════════════╝\n输入 help 获取排错帮助指令，或者点击右上角【AI导师】获取启发思路。`,
      isSystem: true,
      timestamp: '10:45:00',
    },
  ]);

  // 4. 任务清单推进状态
  const [objectiveStates, setObjectiveStates] = useState<boolean[]>(() =>
    new Array(currentChallenge.objectives.length).fill(false)
  );
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | undefined>();

  // 5. 模态窗口与浮层
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isAIMentorOpen, setIsAIMentorOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isScenarioExpanded, setIsScenarioExpanded] = useState(true);

  // 切换关卡统一重置逻辑
  const switchChallenge = useCallback((nextChallenge: Challenge) => {
    setCurrentChallenge(nextChallenge);
    // 若当前关卡为专门的 tutorial 题型，默认进入教学向导，否则进入实战挑战
    setModeTab(nextChallenge.type === 'tutorial' ? 'tutorial' : 'challenge');
    setInjectedCommand(undefined);
    const newEngine = new MockTerminalEngine(nextChallenge);
    setEngine(newEngine);
    setCurrentDir(newEngine.getCurrentDirectory());
    setObjectiveStates(new Array(nextChallenge.objectives.length).fill(false));
    setCommandHistory([]);
    setLastError(undefined);
    setLogs([
      {
        id: Date.now().toString(),
        output: `╔════════════════════════════════════════════════════════════════════╗\n║  已载入关卡：${nextChallenge.title}                ║\n╚════════════════════════════════════════════════════════════════════╝\n${nextChallenge.tagline}\n输入 help 查看当前沙箱环境可用命令，或点击【AI求助】获取思路启发。`,
        isSystem: true,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  // 重置当前关卡
  const handleResetCurrent = useCallback(() => {
    switchChallenge(currentChallenge);
  }, [currentChallenge, switchChallenge]);

  // 处理教学向导中的“一键填入终端”
  const handleFillCommand = useCallback((cmd: string) => {
    setInjectedCommand(cmd);
    // 重置微任务避免阻断后续相同指令再次点击填入
    setTimeout(() => {
      setInjectedCommand(undefined);
    }, 100);
  }, []);

  // 通关结算逻辑 (终端通关或闪卡答对通用)
  const handleChallengePass = useCallback(() => {
    const { updatedStats, isLevelUp: levelUp } = recordChallengeCompleted(
      currentChallenge.id,
      currentChallenge.rewardExp,
      currentChallenge.rewardRadar
    );
    setUserStats(updatedStats);
    setIsLevelUp(levelUp);
    setIsSuccessOpen(true);
  }, [currentChallenge]);

  // 终端命令执行处理
  const handleExecuteCommand = useCallback(
    (cmd: string) => {
      const res = engine.execute(cmd);
      setCommandHistory((prev) => [...prev, cmd]);
      setCurrentDir(engine.getCurrentDirectory());

      if (res.output === '__CLEAR__') {
        setLogs([]);
        return;
      }

      if (res.isError) {
        setLastError(res.output);
      }

      // 同步评测结果
      setObjectiveStates(res.objectiveStates);

      const newLog: TerminalLogEntry = {
        id: Date.now().toString(),
        command: cmd,
        output: res.output,
        isError: res.isError,
        timestamp: new Date().toLocaleTimeString(),
      };

      setLogs((prev) => [...prev, newLog]);

      // 通关判定触发
      if (res.isPassed) {
        setTimeout(() => {
          handleChallengePass();
        }, 600);
      }
    },
    [engine, handleChallengePass]
  );

  // 跳转到下一个关卡
  const handleNextChallenge = useCallback(() => {
    setIsSuccessOpen(false);
    const currentIndex = challenges.findIndex((c) => c.id === currentChallenge.id);
    if (currentIndex >= 0 && currentIndex < challenges.length - 1) {
      switchChallenge(challenges[currentIndex + 1]);
    } else {
      // 若已经是最后一关，打开题库大厅供用户自由挑选
      setIsChallengeHubOpen(true);
    }
  }, [currentChallenge, switchChallenge]);

  // 计算是否还有下一关
  const hasNextChallenge = useMemo(() => {
    const currentIndex = challenges.findIndex((c) => c.id === currentChallenge.id);
    return currentIndex >= 0 && currentIndex < challenges.length - 1;
  }, [currentChallenge]);

  const getCompletions = useCallback(
    (input: string) => engine.getCompletions(input),
    [engine]
  );

  // 根据当前关卡定制移动端快捷短语芯片
  const currentCustomChips = useMemo(() => {
    if (currentChallenge.id === 'war-room-502-bad-gateway') {
      return [
        { label: 'cat error.log', text: 'cat /var/log/nginx/error.log' },
        { label: 'systemctl status', text: 'systemctl status backend.service' },
        { label: 'systemctl start', text: 'systemctl start backend.service' },
        { label: 'curl -I test', text: 'curl -I http://127.0.0.1' },
      ];
    }
    if (currentChallenge.id === 'war-room-disk-full') {
      return [
        { label: 'df -h', text: 'df -h' },
        { label: 'du -sh log', text: 'du -sh /var/log/*' },
        { label: 'rm app_debug.log', text: 'rm /var/log/app_debug.log' },
      ];
    }
    if (currentChallenge.id === 'lab-port-conflict') {
      return [
        { label: 'ss -tlnp', text: 'ss -tlnp' },
        { label: 'ps aux', text: 'ps aux' },
        { label: 'kill 4412', text: 'kill 4412' },
        { label: 'systemctl start nginx', text: 'systemctl start nginx' },
      ];
    }
    if (currentChallenge.id === 'lab-log-grep-awk') {
      return [
        { label: 'cd log', text: 'cd /var/log/nginx' },
        { label: 'cat | grep 404', text: 'cat access.log | grep 404' },
      ];
    }
    return undefined;
  }, [currentChallenge]);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-cyber-bg text-slate-100 font-sans select-none overflow-hidden">
      {/* 1. 顶部状态与品牌导航栏 */}
      <header className="px-3 py-2 bg-slate-900/95 border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyber-blue to-cyber-purple flex items-center justify-center text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.5)]">
            <TerminalIcon className="w-4 h-4 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                OpsMaster
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/40 font-mono uppercase">
                {currentChallenge.type.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="font-semibold text-white">Lv.{userStats.level} 工程师</span>
              <span>·</span>
              <span className="text-amber-400 flex items-center gap-0.5 font-mono font-medium">
                <Flame className="w-3 h-3 text-amber-500" />
                {userStats.currentStreak}d 打卡
              </span>
            </div>
          </div>
        </div>

        {/* 顶部快捷操作 */}
        <div className="flex items-center gap-2">
          {/* 题库大厅入口 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChallengeHubOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/70 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            title="选择关卡"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyber-blue" />
            <span className="hidden sm:inline">题库大厅</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyber-blue/20 text-cyber-blue font-mono">
              {userStats.completedChallengeIds.length}/{challenges.length}
            </span>
          </motion.button>

          {/* 战力画像浮层切换按钮 */}
          <button
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors flex items-center gap-1 text-xs"
            title="查看运维战力画像"
          >
            <BarChart3 className="w-4 h-4 text-cyber-blue" />
            <span className="hidden sm:inline font-mono">战力</span>
          </button>

          {/* AI 导师求助发光按钮 */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAIMentorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:brightness-110 transition-all border border-purple-400/40"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI 求助</span>
          </motion.button>
        </div>
      </header>

      {/* 2. 主体工作区 (两栏在大屏并排) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative p-2 sm:p-3 gap-2">
        {/* 左侧/上方：任务目标与背景卡片 (可折叠) */}
        <div className="shrink-0 md:w-80 flex flex-col gap-2">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-3 shadow-lg">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setIsScenarioExpanded(!isScenarioExpanded)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${userStats.completedChallengeIds.includes(currentChallenge.id) ? 'bg-cyber-green' : 'bg-rose-500 animate-pulse'}`} />
                <h2 className="font-bold text-xs sm:text-sm text-white truncate max-w-[200px]">
                  {currentChallenge.title}
                </h2>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetCurrent();
                  }}
                  title="重置当前关卡"
                  className="p-1 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 hover:text-white">
                  {isScenarioExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isScenarioExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pt-2.5 text-xs space-y-2.5"
                >
                  {/* 实战排查 vs 手把手教学向导切换 Tab */}
                  {currentChallenge.tutorialGuide && currentChallenge.tutorialGuide.length > 0 && (
                    <div className="flex items-center p-0.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] font-medium">
                      <button
                        onClick={() => setModeTab('challenge')}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                          modeTab === 'challenge'
                            ? 'bg-slate-800 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        实战挑战
                      </button>
                      <button
                        onClick={() => setModeTab('tutorial')}
                        className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          modeTab === 'tutorial'
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-amber-300'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>手把手教学</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      </button>
                    </div>
                  )}

                  {/* 模式展示内容 */}
                  {modeTab === 'tutorial' && currentChallenge.tutorialGuide && currentChallenge.tutorialGuide.length > 0 ? (
                    <TutorialGuidePanel
                      steps={currentChallenge.tutorialGuide}
                      objectiveStates={objectiveStates}
                      onFillCommand={handleFillCommand}
                    />
                  ) : (
                    <>
                      <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        {currentChallenge.tagline}
                      </p>

                      {/* 目标清单 CheckList */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                          <span>排查推进清单:</span>
                          <span className="font-mono text-cyber-green">
                            {objectiveStates.filter(Boolean).length}/{currentChallenge.objectives.length} 完成
                          </span>
                        </div>

                        {currentChallenge.objectives.map((obj, i) => (
                          <div
                            key={obj.id || i}
                            className={`flex items-start gap-2 p-2 rounded-lg text-xs transition-colors border ${
                              objectiveStates[i]
                                ? 'bg-cyber-green/10 border-cyber-green/30 text-emerald-300'
                                : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                            }`}
                          >
                            {objectiveStates[i] ? (
                              <CheckCircle2 className="w-4 h-4 text-cyber-green shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                            )}
                            <span className="leading-snug">{obj.text}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 桌面端大屏下展示的战力画像挂件 */}
          <div className="hidden md:flex flex-col gap-2 flex-1 overflow-y-auto">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 p-3 flex flex-col items-center">
              <span className="text-xs font-semibold text-slate-400 mb-1 self-start">运维能力六边形</span>
              <HexagonRadar metrics={userStats.radar} />
            </div>
            <StreakHeatmap
              currentStreak={userStats.currentStreak}
              activityDates={userStats.activityDates}
            />
          </div>
        </div>

        {/* 核心工作区：根据题型渲染 TerminalShell 或 FlashcardLab */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          {currentChallenge.type === 'flashcard' ? (
            <FlashcardLab
              challenge={currentChallenge}
              onPass={handleChallengePass}
              onAskAI={(prompt) => {
                setIsAIMentorOpen(true);
              }}
            />
          ) : (
            <TerminalShell
              logs={logs}
              currentDir={currentDir}
              onExecute={handleExecuteCommand}
              onReset={handleResetCurrent}
              getCompletions={getCompletions}
              customChips={currentCustomChips}
              injectedCommand={injectedCommand}
            />
          )}
        </main>
      </div>

      {/* 3. 移动端快捷浮窗：战力画像弹窗 (移动端抽屉) */}
      <AnimatePresence>
        {isStatsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm md:hidden">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyber-blue" />
                  个人运维能力战力模型
                </h3>
                <button onClick={() => setIsStatsOpen(false)} className="text-slate-400 text-xs px-2 py-1">
                  关闭
                </button>
              </div>

              <div className="flex justify-center">
                <HexagonRadar metrics={userStats.radar} />
              </div>

              <StreakHeatmap
                currentStreak={userStats.currentStreak}
                activityDates={userStats.activityDates}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. 关卡大厅选关中心抽屉 */}
      <ChallengeHubModal
        isOpen={isChallengeHubOpen}
        onClose={() => setIsChallengeHubOpen(false)}
        challenges={challenges}
        currentChallengeId={currentChallenge.id}
        completedIds={userStats.completedChallengeIds}
        onSelectChallenge={(c) => switchChallenge(c)}
      />

      {/* 5. AI 智能导师抽屉 */}
      <AIMentorSheet
        isOpen={isAIMentorOpen}
        onClose={() => setIsAIMentorOpen(false)}
        challenge={currentChallenge}
        currentDir={currentDir}
        commandHistory={commandHistory}
        lastError={lastError}
      />

      {/* 6. 通关欢庆与粒子结算弹窗 */}
      <SuccessModal
        isOpen={isSuccessOpen}
        challenge={currentChallenge}
        isLevelUp={isLevelUp}
        hasNextChallenge={hasNextChallenge}
        onNext={handleNextChallenge}
        onReplay={() => {
          setIsSuccessOpen(false);
          handleResetCurrent();
        }}
      />
    </div>
  );
}

export default App;

