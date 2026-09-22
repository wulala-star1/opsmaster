export type ChallengeDimension = 
  | 'core_tools'      // 基础语法与核心工具 (Linux基础/三剑客/Shell)
  | 'services'        // 应用与常见服务 (Nginx/Systemd/SSH/Cron)
  | 'modern_devops'   // 现代运维组件 (Docker/K8s/Prometheus)
  | 'troubleshooting' // 性能调优与故障排查 (CPU/内存/磁盘/网络)
;

export type ChallengeDifficulty = 'L1_EASY' | 'L2_MEDIUM' | 'L3_HARD';

export type ChallengeType = 'flashcard' | 'terminal_lab' | 'war_room' | 'tutorial';

export type RadarMetrics = {
  kernel: number;
  network: number;
  storage: number;
  container: number;
  troubleshooting: number;
  security: number;
};

export type EvalRuleType = 
  | 'stdout_contains' 
  | 'stdout_regex' 
  | 'file_state' 
  | 'service_state'
  | 'process_state'
  | 'disk_state'
  | 'command_executed';

export interface EvalRule {
  type: EvalRuleType;
  target: string;                    // 命令目标、文件名、服务名或进程名
  expectedSnippet?: string;          // 预期包含的输出文本
  regexPattern?: string;             // 正则匹配
  expectedState?: 'active' | 'inactive' | 'stopped' | 'deleted' | 'exists';
  maxDiskUsagePercent?: number;      // 针对磁盘规则的使用率上限
  hintOnFail: string;
}

export interface ChallengeObjective {
  id: string;
  text: string;
  ruleIndex?: number;                // 关联的 evalRules 索引，自动绑定判定
}

export interface CommandBreakdownItem {
  flag: string;
  meaning: string;
}

export interface TutorialStep {
  stepIndex: number;
  title: string;
  conceptExplanation: string;        // 步骤原理深度剖析与排查依据
  recommendedCommand: string;        // 推荐执行命令
  commandBreakdown?: CommandBreakdownItem[]; // 命令参数逐一拆解
  expectedResultHint: string;        // 终端输出关键特征点解读
}

export interface FlashcardData {
  question: string;
  scenario?: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  keyTakeaway: string;
}

export interface VirtualDiskPartition {
  filesystem: string;
  size: string;
  used: string;
  avail: string;
  usePercent: string;
  mount: string;
}

export interface VirtualProcess {
  pid: number;
  user: string;
  time: string;
  command: string;
}

export interface Challenge {
  id: string;
  title: string;
  dimension: ChallengeDimension;
  difficulty: ChallengeDifficulty;
  type: ChallengeType;
  tagline: string;
  scenarioMarkdown: string;
  objectives: ChallengeObjective[];
  initialDir: string;
  initialFiles: Record<string, string>; // path -> content
  initialServices?: Record<string, 'active' | 'inactive' | 'failed'>;
  initialPorts?: Record<number, { service: string; pid: number }>;
  initialProcesses?: VirtualProcess[];
  initialDisks?: VirtualDiskPartition[];
  evalRules: EvalRule[];
  socraticPrompt: string;
  rewardExp: number;
  rewardRadar: Partial<RadarMetrics>;
  flashcardData?: FlashcardData;
  tutorialGuide?: TutorialStep[];
}

export interface TerminalLogEntry {
  id: string;
  command?: string;
  output?: string;
  isError?: boolean;
  isSystem?: boolean;
  timestamp: string;
}

export interface UserStats {
  level: number;
  exp: number;
  currentStreak: number;
  completedChallengeIds: string[];
  activityDates: string[]; // YYYY-MM-DD
  radar: RadarMetrics;
}
