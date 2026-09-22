export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIProviderConfig {
  provider: 'deepseek' | 'openai' | 'custom';
  apiKey?: string;
  baseURL?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface MentorContext {
  challengeTitle: string;
  scenario: string;
  currentDir: string;
  recentCommands: string[];
  lastErrorOutput?: string;
  objectives: string[];
}
