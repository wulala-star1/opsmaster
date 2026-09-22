import React from 'react';
import { motion } from 'framer-motion';
import { CornerDownLeft, Sparkles } from 'lucide-react';

interface MobileAuxKeyboardProps {
  onInsertText: (text: string) => void;
  onTabComplete: () => void;
  onClearInput: () => void;
  onSubmitCommand: () => void;
  completionsCount?: number;
  customChips?: { label: string; text: string }[];
}

export const MobileAuxKeyboard: React.FC<MobileAuxKeyboardProps> = ({
  onInsertText,
  onTabComplete,
  onClearInput,
  onSubmitCommand,
  completionsCount = 0,
  customChips,
}) => {
  // 核心运维单字符与控制键
  const primaryKeys = [
    { label: 'Tab', action: onTabComplete, highlight: completionsCount > 0 },
    { label: 'Ctrl+C', action: onClearInput },
    { label: '|', action: () => onInsertText(' | ') },
    { label: '~', action: () => onInsertText('~') },
    { label: '/', action: () => onInsertText('/') },
    { label: '-', action: () => onInsertText('-') },
    { label: '$', action: () => onInsertText('$') },
  ];

  // 移动端常见一键短语快捷芯片 (关卡专用或通用预设)
  const defaultChips = [
    { label: 'df -h', text: 'df -h' },
    { label: 'ps aux', text: 'ps aux' },
    { label: 'ss -tlnp', text: 'ss -tlnp' },
    { label: 'cat error.log', text: 'cat /var/log/nginx/error.log' },
    { label: 'curl -I test', text: 'curl -I http://127.0.0.1' },
    { label: 'systemctl restart', text: 'systemctl restart backend.service' },
  ];

  const chipsToRender = customChips && customChips.length > 0 ? customChips : defaultChips;

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-2 select-none z-20">
      {/* 快捷指令滑块 (横向轻滑) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
        <span className="text-slate-500 font-mono text-[11px] px-1 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-cyber-blue" />
          快捷:
        </span>
        {chipsToRender.map((chip, idx) => (
          <motion.button
            key={idx}
            whileTap={{ scale: 0.94 }}
            onClick={() => onInsertText(chip.text)}
            className="shrink-0 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700/80 active:bg-cyber-blue/20 text-slate-300 hover:text-white border border-slate-700/60 font-mono transition-colors text-[11px]"
          >
            {chip.label}
          </motion.button>
        ))}
      </div>

      {/* 核心控制键条 */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 flex-1">
          {primaryKeys.map((key, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.9 }}
              onClick={key.action}
              className={`shrink-0 px-3 py-1.5 rounded font-mono text-xs font-semibold border transition-all ${
                key.highlight
                  ? 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/60 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                  : 'bg-slate-800/90 text-slate-200 border-slate-700/80 hover:bg-slate-700 active:bg-slate-600'
              }`}
            >
              {key.label}
              {key.label === 'Tab' && completionsCount > 0 && (
                <span className="ml-1 text-[10px] px-1 py-0.2 bg-cyber-blue text-slate-950 rounded-full font-bold">
                  {completionsCount}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        {/* 提交执行按钮 */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onSubmitCommand}
          className="shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded font-mono text-xs font-bold bg-cyber-green/20 text-cyber-green border border-cyber-green/50 hover:bg-cyber-green/30 active:bg-cyber-green/40 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
        >
          <span>Run</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
};
