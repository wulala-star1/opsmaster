import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Settings2, KeyRound } from 'lucide-react';
import { AIMessage } from '../../types/ai';
import { streamMentorAdvice, loadAIConfig, saveAIConfig } from '../../services/aiService';
import { Challenge } from '../../types/challenge';

interface AIMentorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  currentDir: string;
  commandHistory: string[];
  lastError?: string;
}

export const AIMentorSheet: React.FC<AIMentorSheetProps> = ({
  isOpen,
  onClose,
  challenge,
  currentDir,
  commandHistory,
  lastError,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: `你好！我是你的 Linux/DevOps 苏格拉底导师。我不会直接剧透答案，但我会引导你发现系统底层运行的蛛丝马迹。遇到疑难杂症随时问我！`,
      timestamp: '刚刚',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(loadAIConfig().apiKey || '');
  const [modelInput, setModelInput] = useState(loadAIConfig().model || 'deepseek-chat');

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputVal;
    if (!textToSend.trim() || isStreaming) return;

    const userMsgId = Date.now().toString();
    const userMsg: AIMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: '刚刚',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsStreaming(true);

    const botMsgId = (Date.now() + 1).toString();
    const initialBotMsg: AIMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: '正在思考...',
    };
    setMessages((prev) => [...prev, initialBotMsg]);

    const context = {
      challengeTitle: challenge.title,
      scenario: challenge.scenarioMarkdown,
      currentDir,
      recentCommands: commandHistory.slice(-5),
      lastErrorOutput: lastError,
      objectives: challenge.objectives.map((o) => o.text),
    };

    await streamMentorAdvice(
      textToSend,
      context,
      (chunk) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === botMsgId ? { ...msg, content: msg.content + chunk } : msg))
        );
      },
      (fullText) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, content: fullText, timestamp: '刚刚' } : msg
          )
        );
      }
    );
  };

  const handleSaveConfig = () => {
    saveAIConfig({ apiKey: apiKeyInput, model: modelInput });
    setShowConfig(false);
  };

  const quickPrompts = [
    '🧐 我卡住了，接下来该查什么？',
    '🔍 为什么会发生 502 Bad Gateway？',
    '⚡ 如何检查 backend 服务是否在监听端口？',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="w-full max-w-lg h-[80vh] sm:h-[620px] bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden"
          >
            {/* 抽屉头部 */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyber-purple/20 border border-cyber-purple/50 flex items-center justify-center text-cyber-purple shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-white">AI 智能导师</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40 font-mono">
                      苏格拉底模式
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">只启发排查思路 · 绝不直接剧透答案</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                  title="配置 API Key"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 可展开的 API 配置抽屉 (方便用户后续接入真实的 OpenAI/DeepSeek API Key) */}
            {showConfig && (
              <div className="p-3 bg-slate-800/90 border-b border-slate-700 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-cyber-blue font-semibold">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>预留模型 API 接入 (OpenAI / DeepSeek 协议兼容)</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="password"
                    placeholder="输入 DeepSeek 或 OpenAI API Key (留空将采用本地智能模拟)"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyber-purple text-xs font-mono"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="模型名 (如 deepseek-chat 或 gpt-4o)"
                      value={modelInput}
                      onChange={(e) => setModelInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyber-purple text-xs font-mono"
                    />
                    <button
                      onClick={handleSaveConfig}
                      className="px-3 py-1 bg-cyber-purple text-white rounded font-medium hover:bg-purple-600 transition-colors text-xs"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 消息历史滚动区 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-cyber-blue/20 text-white border border-cyber-blue/40 rounded-br-none'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    {msg.role === 'assistant' && isStreaming && msg.id === messages[messages.length - 1]?.id && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyber-purple animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 快捷启发求助问题 */}
            <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto border-t border-slate-800/80 bg-slate-900/60 scrollbar-none">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={isStreaming}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-cyber-purple/20 border border-slate-700/60 text-[11px] transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-cyber-purple" />
                  {q}
                </button>
              ))}
            </div>

            {/* 底部输入框 */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="向导师描述你的疑惑或卡点..."
                disabled={isStreaming}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm outline-none focus:border-cyber-purple transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={isStreaming || !inputVal.trim()}
                className="p-2.5 rounded-xl bg-cyber-purple text-white hover:bg-purple-600 disabled:opacity-50 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
