import { Challenge, EvalRule, VirtualDiskPartition, VirtualProcess } from '../types/challenge';
import { VFile } from './mockTerminalEngine';

export interface SandboxSnapshot {
  lastCommand: string;
  lastOutput: string;
  commandHistory: string[];
  currentDir: string;
  fileSystem: VFile;
  servicesState: Record<string, 'active' | 'inactive' | 'failed'>;
  portsState: Record<number, { service: string; pid: number }>;
  processes: VirtualProcess[];
  disks: VirtualDiskPartition[];
}

export class EvalEngine {
  private challenge: Challenge;

  constructor(challenge: Challenge) {
    this.challenge = challenge;
  }

  /**
   * 评测单个规则是否命中
   */
  public evaluateRule(rule: EvalRule, snapshot: SandboxSnapshot): boolean {
    switch (rule.type) {
      case 'stdout_contains': {
        const cmdMatched = !rule.target || snapshot.lastCommand.includes(rule.target);
        const snippetMatched = !rule.expectedSnippet || snapshot.lastOutput.includes(rule.expectedSnippet);
        return cmdMatched && snippetMatched;
      }

      case 'stdout_regex': {
        if (!rule.regexPattern) return false;
        try {
          const reg = new RegExp(rule.regexPattern, 'i');
          const targetMatched = !rule.target || snapshot.lastCommand.includes(rule.target);
          return targetMatched && reg.test(snapshot.lastOutput);
        } catch (e) {
          return false;
        }
      }

      case 'command_executed': {
        return snapshot.commandHistory.some((c) => c.includes(rule.target));
      }

      case 'service_state': {
        const actualState = snapshot.servicesState[rule.target];
        return actualState === (rule.expectedState || 'active');
      }

      case 'process_state': {
        const isRunning = snapshot.processes.some((p) => 
          p.command.includes(rule.target) || p.pid.toString() === rule.target
        );
        if (rule.expectedState === 'stopped') {
          return !isRunning;
        }
        return isRunning;
      }

      case 'file_state': {
        const fileExists = this.checkFileExists(snapshot.fileSystem, rule.target);
        if (rule.expectedState === 'deleted') {
          return !fileExists;
        }
        return fileExists;
      }

      case 'disk_state': {
        const disk = snapshot.disks.find((d) => d.mount === rule.target || d.filesystem === rule.target);
        if (!disk) return false;
        const currentPct = parseInt(disk.usePercent.replace('%', ''), 10);
        if (rule.maxDiskUsagePercent !== undefined) {
          return currentPct <= rule.maxDiskUsagePercent;
        }
        return false;
      }

      default:
        return false;
    }
  }

  /**
   * 评测所有 objectives，返回各个目标的完成布尔状态
   */
  public evaluateObjectives(
    snapshot: SandboxSnapshot,
    prevStates: boolean[]
  ): boolean[] {
    return this.challenge.objectives.map((obj, idx) => {
      // 已经完成的目标保持已完成
      if (prevStates[idx]) return true;

      // 如果指定了 ruleIndex
      if (obj.ruleIndex !== undefined && this.challenge.evalRules[obj.ruleIndex]) {
        return this.evaluateRule(this.challenge.evalRules[obj.ruleIndex], snapshot);
      }

      // 如果没有指定 ruleIndex，默认使用同索引规则或根据关卡特性智能推导
      if (this.challenge.evalRules[idx]) {
        return this.evaluateRule(this.challenge.evalRules[idx], snapshot);
      }

      return false;
    });
  }

  /**
   * 评测整道题目是否判定通关
   * 逻辑：如果所有 objectives 都已完成，或者触发了关键终极规则
   */
  public isChallengePassed(
    snapshot: SandboxSnapshot,
    objectiveStates: boolean[]
  ): boolean {
    if (this.challenge.objectives.length > 0) {
      return objectiveStates.every(Boolean);
    }
    // 若没有细分 objectives，则看所有 evalRules
    return this.challenge.evalRules.every((r) => this.evaluateRule(r, snapshot));
  }

  private checkFileExists(root: VFile, pathStr: string): boolean {
    const parts = pathStr.split('/').filter(Boolean);
    let curr: VFile | undefined = root;
    for (const part of parts) {
      if (!curr || curr.type !== 'dir' || !curr.children || !curr.children[part]) {
        return false;
      }
      curr = curr.children[part];
    }
    return true;
  }
}
