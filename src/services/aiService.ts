import { AIMessage, AIProviderConfig, MentorContext } from '../types/ai';

const STORAGE_KEY_AI_CONFIG = 'opsmaster_ai_config';

export const defaultAIConfig: AIProviderConfig = {
  provider: 'deepseek',
  apiKey: '',
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  temperature: 0.6,
};

export function loadAIConfig(): AIProviderConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AI_CONFIG);
    if (raw) {
      return { ...defaultAIConfig, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load AI config from storage', e);
  }
  return defaultAIConfig;
}

export function saveAIConfig(config: Partial<AIProviderConfig>) {
  const current = loadAIConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY_AI_CONFIG, JSON.stringify(updated));
  return updated;
}

/**
 * 构造苏格拉底式启发式系统提示词
 */
export function buildSocraticSystemPrompt(ctx: MentorContext): string {
  return `你叫 OpsMaster-AI，是专精 Linux/DevOps 的苏格拉底式智能导师。
当前关卡：${ctx.challengeTitle}
场景背景：${ctx.scenario}
当前任务目标：${ctx.objectives.join('; ')}
用户当前工作目录：${ctx.currentDir}
用户最近执行的命令记录：
${ctx.recentCommands.map((c, i) => `  ${i + 1}. ${c}`).join('\n') || '（暂无输入）'}
${ctx.lastErrorOutput ? `用户最后一次遇到的错误输出：\n${ctx.lastErrorOutput}` : ''}

【核心教学法则 - 绝对严格遵守】：
1. 严禁直接给出最终的完整答案命令或一键修复脚本！
2. 采用【苏格拉底反问与排查思路启发】：引导用户思考“问题本质出在哪个环节（网络连接/端口占用/进程崩溃/权限异常/日志记录）”。
3. 提示层级分为：
   - 启发一：指出排查的方向（如“先看看上游服务的状态是否正常运行，日志里记录了什么？”）
   - 启发二：提示可以使用哪类工具或定位思路（如“考虑用 netstat/ss 检查 8080 端口，或者查看 /var/log/nginx/error.log”）
   - 启发三（仅在用户多次卡住时）：提示命令的骨架参数（如“例如：systemctl status ...”），但仍让用户补全参数。
4. 语言风格：专业、沉着、极客感，字数控制在 150 字以内，简洁有力。`;
}

/**
 * 模拟备用苏格拉底回复（在未配置真实 API Key 时的智能模拟流式输出）
 */
const mockSocraticResponses: string[] = [
  "观察得很仔细！在面对 502 Bad Gateway 时，通常意味着 Nginx 作为反向代理，无法与后端的上游服务（Upstream）建立通信。\n\n💡 **启发提问**：\n你排查过负责后端业务的进程（例如 8080 端口的应用）当前是存活状态吗？试着用 `ps aux` 或者 `ss -tlnp` 确认一下它的状态。",
  "注意到了吗？虽然 Nginx 自身运行正常，但反向代理的错误通常会写入专用日志中。\n\n🔍 **思路指引**：\n去查看 `/var/log/nginx/error.log` 的最新末尾几行，往往会直接暴露 Connection refused 或 upstream timed out 的确切端口与原因！",
  "非常接近真相了！后端的 upstream 服务似乎没有启动。运维工程师的标准动作是：\n1. 检查后端服务的 systemd 单元状态。\n2. 或者查看对应脚本为什么退出，然后再尝试拉起它。\n\n试试输入 `systemctl status backend.service` 探查究竟！"
];

/**
 * 流式请求 AI 导师接口
 * 预留标准 OpenAI 兼容的 chat.completions stream 协议，便于未来无缝直连 DeepSeek / OpenAI
 */
export async function streamMentorAdvice(
  userQuery: string,
  context: MentorContext,
  onChunk: (chunk: string) => void,
  onFinish: (fullText: string) => void
): Promise<void> {
  const config = loadAIConfig();

  // 如果配置了真实 API Key，发起真实的 Fetch SSE 流式请求
  if (config.apiKey && config.apiKey.trim().length > 5) {
    const url = `${config.baseURL?.replace(/\/$/, '')}/chat/completions`;
    const systemPrompt = buildSocraticSystemPrompt(context);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuery }
          ],
          stream: true,
          temperature: config.temperature ?? 0.6,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI 接口返回错误: HTTP ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';

      if (!reader) {
        throw new Error('ReadableStream not supported by response');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullText += delta;
                onChunk(delta);
              }
            } catch (err) {
              // Ignore partial JSON lines in stream
            }
          }
        }
      }

      onFinish(fullText);
      return;
    } catch (error) {
      console.warn('Real AI streaming failed, falling back to smart simulation:', error);
      // Fallback gracefully
    }
  }

  // 默认模拟打字机流式输出体验
  const mockText = mockSocraticResponses[Math.floor(Math.random() * mockSocraticResponses.length)];
  let streamed = '';
  for (let i = 0; i < mockText.length; i++) {
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 25));
    const char = mockText[i];
    streamed += char;
    onChunk(char);
  }
  onFinish(streamed);
}
