import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, RotateCcw, Copy, Check } from 'lucide-react';
import { TerminalLogEntry } from '../../types/challenge';
import { MobileAuxKeyboard } from './MobileAuxKeyboard';

interface TerminalShellProps {
  logs: TerminalLogEntry[];
  currentDir: string;
  onExecute: (cmd: string) => void;
  onReset: () => void;
  getCompletions: (input: string) => string[];
  customChips?: { label: string; text: string }[];
  injectedCommand?: string;
}

export const TerminalShell: React.FC<TerminalShellProps> = ({
  logs,
  currentDir,
  onExecute,
  onReset,
  getCompletions,
  customChips,
  injectedCommand,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [completions, setCompletions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [tempInput, setTempInput] = useState('');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 提取历史命令记录 (过滤空命令和系统提示)
  const commandHistory = logs
    .filter((l) => l.command && l.command.trim().length > 0)
    .map((l) => l.command as string);

  // 监听外部注入的命令 (如教学模式一键填入)
  useEffect(() => {
    if (injectedCommand) {
      setInputVal(injectedCommand);
      inputRef.current?.focus();
    }
  }, [injectedCommand]);

  // 自动滚动到底部
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 当输入变化时检查补全候选
  useEffect(() => {
    if (inputVal.trim()) {
      const candidates = getCompletions(inputVal);
      setCompletions(candidates);
    } else {
      setCompletions([]);
    }
  }, [inputVal, getCompletions]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;
    onExecute(inputVal);
    setInputVal('');
    setCompletions([]);
    setHistoryIndex(-1);
    setTempInput('');
  };

  const handleTabComplete = () => {
    if (completions.length > 0) {
      const parts = inputVal.split(' ');
      parts[parts.length - 1] = completions[0];
      const nextInput = parts.join(' ') + (completions.length === 1 ? ' ' : '');
      setInputVal(nextInput);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. 处理 Tab 键
    if (e.key === 'Tab') {
      e.preventDefault();
      handleTabComplete();
      return;
    }

    // 2. 处理向上键 (历史命令回溯)
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      if (historyIndex === -1) {
        setTempInput(inputVal);
        const nextIdx = commandHistory.length - 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      } else if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      }
      return;
    }

    // 3. 处理向下键 (历史命令下移)
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;

      if (historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      } else {
        setHistoryIndex(-1);
        setInputVal(tempInput);
      }
      return;
    }

    // 4. 处理 Ctrl+C 清空当前行
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setInputVal('');
      setHistoryIndex(-1);
      return;
    }
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => (l.command ? `root@opsmaster# ${l.command}\n${l.output || ''}` : l.output || ''))
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-950/90 rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* 终端顶部操作条 (macOS 极客风格) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 select-none">
        {/* 三色红黄绿圆点 */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80 border border-rose-400/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-400/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
          <span className="ml-2 text-xs font-mono text-slate-400 flex items-center gap-1.5 truncate max-w-[220px] sm:max-w-none">
            <TerminalIcon className="w-3.5 h-3.5 text-cyber-blue shrink-0" />
            <span className="text-cyber-green font-semibold">root@opsmaster</span>:
            <span className="text-cyber-blue">{currentDir}</span>
          </span>
        </div>

        {/* 辅助操作按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyLogs}
            title="复制终端内容"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-cyber-green" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onReset}
            title="重置终端环境"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 终端正文显示区域 */}
      <div
        className="flex-1 overflow-y-auto p-3 font-mono text-xs sm:text-sm space-y-2 select-text"
        onClick={() => inputRef.current?.focus()}
      >
        {logs.map((log) => (
          <div key={log.id} className="leading-relaxed">
            {log.command && (
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-cyber-green font-bold">#</span>
                <span className="text-white font-medium">{log.command}</span>
              </div>
            )}
            {log.output && (
              <pre
                className={`mt-1 whitespace-pre-wrap font-mono text-xs ${
                  log.isError
                    ? 'text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/30'
                    : log.isSystem
                    ? 'text-cyber-blue/90'
                    : 'text-slate-300'
                }`}
              >
                {log.output}
              </pre>
            )}
          </div>
        ))}

        {/* 自动补全提示浮层 (若有候选推荐) */}
        {completions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-1 px-2 bg-slate-900/80 rounded border border-slate-800 text-xs font-mono">
            <span className="text-slate-500">按 Tab 补全:</span>
            {completions.slice(0, 5).map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const parts = inputVal.split(' ');
                  parts[parts.length - 1] = c;
                  setInputVal(parts.join(' ') + ' ');
                  inputRef.current?.focus();
                }}
                className="text-cyber-blue underline underline-offset-2 hover:text-white"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* 正在输入行 */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <span className="text-cyber-green font-bold shrink-0">#</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white font-mono text-xs sm:text-sm outline-none caret-cyber-blue placeholder-slate-600"
            placeholder="输入 Linux 命令 (↑/↓翻阅历史, Tab补全, help帮助)..."
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />
        </form>
        <div ref={terminalEndRef} />
      </div>

      {/* 移动端专属扩展辅助键盘 */}
      <MobileAuxKeyboard
        onInsertText={(text) => {
          setInputVal((prev) => prev + text);
          inputRef.current?.focus();
        }}
        onTabComplete={handleTabComplete}
        onClearInput={() => setInputVal('')}
        onSubmitCommand={() => handleSubmit()}
        completionsCount={completions.length}
        customChips={customChips}
      />
    </div>
  );
};

