import {
  Challenge,
  VirtualDiskPartition,
  VirtualProcess,
} from '../types/challenge';
import { EvalEngine, SandboxSnapshot } from './evalEngine';

export interface VFile {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  size?: number; // 字节大小
  children?: Record<string, VFile>;
}

export class MockTerminalEngine {
  private currentPath: string = '/root';
  private fileSystem: VFile;
  private servicesState: Record<string, 'active' | 'inactive' | 'failed'> = {};
  private portsState: Record<number, { service: string; pid: number }> = {};
  private processes: VirtualProcess[] = [];
  private disks: VirtualDiskPartition[] = [];
  private challenge: Challenge;
  private commandHistory: string[] = [];
  private evalEngine: EvalEngine;
  private objectiveStates: boolean[] = [];

  constructor(challenge: Challenge) {
    this.challenge = challenge;
    this.currentPath = challenge.initialDir || '/root';
    this.evalEngine = new EvalEngine(challenge);
    this.objectiveStates = new Array(challenge.objectives.length).fill(false);

    // 1. 初始化服务与端口状态
    this.servicesState = challenge.initialServices
      ? { ...challenge.initialServices }
      : { 'nginx': 'active', 'backend.service': 'inactive' };

    this.portsState = challenge.initialPorts
      ? { ...challenge.initialPorts }
      : { 80: { service: 'nginx', pid: 1042 } };

    // 2. 初始化进程列表
    this.processes = challenge.initialProcesses
      ? [...challenge.initialProcesses]
      : [
          { pid: 1, user: 'root', time: '0:02', command: '/sbin/init' },
          { pid: 320, user: 'root', time: '0:00', command: '/lib/systemd/systemd-journald' },
          { pid: 1042, user: 'nginx', time: '0:01', command: 'nginx: master process /usr/sbin/nginx' },
          { pid: 1043, user: 'nginx', time: '0:05', command: 'nginx: worker process' },
        ];

    // 3. 初始化磁盘分区
    this.disks = challenge.initialDisks
      ? [...challenge.initialDisks]
      : [
          { filesystem: '/dev/vda1', size: '40G', used: '8.2G', avail: '31.8G', usePercent: '21%', mount: '/' },
          { filesystem: '/dev/vda2', size: '20G', used: '4.5G', avail: '15.5G', usePercent: '23%', mount: '/var' },
        ];

    // 4. 构建虚拟文件系统
    this.fileSystem = this.buildInitialFileSystem(challenge.initialFiles);
  }

  private buildInitialFileSystem(initialFiles: Record<string, string>): VFile {
    const root: VFile = {
      name: '/',
      type: 'dir',
      children: {
        root: { name: 'root', type: 'dir', children: {} },
        etc: { name: 'etc', type: 'dir', children: {} },
        var: {
          name: 'var',
          type: 'dir',
          children: {
            log: { name: 'log', type: 'dir', children: {} },
          },
        },
        opt: { name: 'opt', type: 'dir', children: {} },
        tmp: { name: 'tmp', type: 'dir', children: {} },
        bin: { name: 'bin', type: 'dir', children: {} },
      },
    };

    // 叠加并挂载关卡指定的文件
    for (const [pathStr, content] of Object.entries(initialFiles)) {
      this.writeVirtualFile(root, pathStr, content);
    }
    return root;
  }

  private writeVirtualFile(root: VFile, pathStr: string, content: string, append: boolean = false) {
    const parts = pathStr.split('/').filter(Boolean);
    let curr = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!curr.children) curr.children = {};
      if (!curr.children[part]) {
        curr.children[part] = { name: part, type: 'dir', children: {} };
      }
      curr = curr.children[part];
    }
    const fileName = parts[parts.length - 1];
    if (curr.children) {
      const existing = curr.children[fileName];
      const newContent = append && existing?.content ? existing.content + '\n' + content : content;
      curr.children[fileName] = {
        name: fileName,
        type: 'file',
        content: newContent,
        size: newContent.length,
      };
    }
  }

  private removeVirtualNode(pathStr: string): boolean {
    const normalized = this.normalizePath(pathStr);
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length === 0) return false;

    let curr = this.fileSystem;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!curr.children || !curr.children[part]) return false;
      curr = curr.children[part];
    }

    const targetName = parts[parts.length - 1];
    if (curr.children && curr.children[targetName]) {
      delete curr.children[targetName];

      // 如果删除了 /var/ 下的文件，动态更新 /var 磁盘分区的占用率
      if (normalized.startsWith('/var/')) {
        const varDisk = this.disks.find((d) => d.mount === '/var');
        if (varDisk) {
          varDisk.used = '3.8G';
          varDisk.avail = '16.2G';
          varDisk.usePercent = '19%';
        }
      }
      return true;
    }
    return false;
  }

  private normalizePath(pathStr: string): string {
    const target = pathStr.startsWith('/')
      ? pathStr
      : this.currentPath === '/'
      ? `/${pathStr}`
      : `${this.currentPath}/${pathStr}`;

    const parts = target.split('/').filter(Boolean);
    const resolvedParts: string[] = [];

    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        resolvedParts.pop();
      } else {
        resolvedParts.push(part);
      }
    }
    return '/' + resolvedParts.join('/');
  }

  public resolveNode(pathStr: string): VFile | null {
    const normalized = this.normalizePath(pathStr);
    const parts = normalized.split('/').filter(Boolean);

    let curr = this.fileSystem;
    for (const part of parts) {
      if (curr.type !== 'dir' || !curr.children || !curr.children[part]) {
        return null;
      }
      curr = curr.children[part];
    }
    return curr;
  }

  public getCurrentDirectory(): string {
    return this.currentPath;
  }

  public getHistory(): string[] {
    return this.commandHistory;
  }

  public getObjectiveStates(): boolean[] {
    return this.objectiveStates;
  }

  public getCompletions(currentInput: string): string[] {
    const commonCommands = [
      'ls', 'cd', 'cat', 'pwd', 'grep', 'curl', 'ps', 'systemctl',
      'netstat', 'ss', 'tail', 'head', 'clear', 'help', 'df', 'du',
      'free', 'kill', 'pkill', 'rm', 'mkdir', 'touch', 'echo'
    ];
    const parts = currentInput.trimStart().split(' ');

    if (parts.length === 1) {
      const prefix = parts[0];
      return commonCommands.filter((c) => c.startsWith(prefix) && c !== prefix);
    }

    const lastWord = parts[parts.length - 1];
    const node = this.resolveNode(this.currentPath);
    if (node && node.children) {
      const files = Object.keys(node.children);
      return files.filter((f) => f.startsWith(lastWord) && f !== lastWord);
    }
    return [];
  }

  /**
   * 执行用户输入的单条或管道命令
   */
  public execute(rawCommand: string): {
    output: string;
    isError?: boolean;
    isPassed?: boolean;
    objectiveStates: boolean[];
  } {
    const trimmed = rawCommand.trim();
    if (!trimmed) {
      return { output: '', objectiveStates: this.objectiveStates };
    }

    this.commandHistory.push(trimmed);

    // 检查重定向 (例如 echo "" > error.log 或 cat xxx >> file)
    if (trimmed.includes('>') || trimmed.includes('>>')) {
      const isAppend = trimmed.includes('>>');
      const [cmdPart, targetFile] = trimmed.split(isAppend ? '>>' : '>').map((s) => s.trim());
      const res = this.executeCore(cmdPart);
      if (targetFile) {
        this.writeVirtualFile(this.fileSystem, this.normalizePath(targetFile), res.output, isAppend);
        // 如果清空或写入了大日志，联动更新磁盘
        if (targetFile.includes('log')) {
          const varDisk = this.disks.find((d) => d.mount === '/var');
          if (varDisk) {
            varDisk.used = '3.5G';
            varDisk.avail = '16.5G';
            varDisk.usePercent = '18%';
          }
        }
      }
      return this.finishExecution(trimmed, '', false);
    }

    // 处理管道 (如 cat error.log | grep upstream)
    if (trimmed.includes('|')) {
      return this.executePipeline(trimmed);
    }

    const coreRes = this.executeCore(trimmed);
    return this.finishExecution(trimmed, coreRes.output, coreRes.isError);
  }

  private executeCore(trimmed: string): { output: string; isError?: boolean } {
    const tokens = trimmed.split(/\s+/);
    const cmd = tokens[0];
    const args = tokens.slice(1);

    let output = '';
    let isError = false;

    switch (cmd) {
      case 'pwd':
        output = this.currentPath;
        break;

      case 'cd': {
        const target = args[0] || '/root';
        if (target === '~') {
          this.currentPath = '/root';
          output = '';
        } else {
          const node = this.resolveNode(target);
          if (!node) {
            output = `bash: cd: ${target}: No such file or directory`;
            isError = true;
          } else if (node.type !== 'dir') {
            output = `bash: cd: ${target}: Not a directory`;
            isError = true;
          } else {
            this.currentPath = this.normalizePath(target);
          }
        }
        break;
      }

      case 'ls': {
        const targetPath = args.find((a) => !a.startsWith('-')) || this.currentPath;
        const isLong = args.some((a) => a.includes('l'));
        const isAll = args.some((a) => a.includes('a'));

        const node = this.resolveNode(targetPath);
        if (!node) {
          output = `ls: cannot access '${targetPath}': No such file or directory`;
          isError = true;
        } else if (node.type === 'file') {
          output = node.name;
        } else if (node.children) {
          const items = Object.values(node.children);
          if (isLong) {
            const lines = items.map((it) => {
              const isDir = it.type === 'dir';
              const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
              const size = isDir ? 4096 : (it.size || it.content?.length || 128);
              return `${perms} 1 root root ${size.toString().padStart(5, ' ')} Sep 22 10:30 ${it.name}${isDir ? '/' : ''}`;
            });
            if (isAll) {
              lines.unshift('drwxr-xr-x 4 root root  4096 Sep 22 10:30 ..');
              lines.unshift('drwxr-xr-x 2 root root  4096 Sep 22 10:30 .');
            }
            output = lines.join('\n');
          } else {
            output = items.map((it) => (it.type === 'dir' ? `${it.name}/` : it.name)).join('  ');
          }
        }
        break;
      }

      case 'cat': {
        if (args.length === 0) {
          output = 'cat: missing file operand';
          isError = true;
          break;
        }
        const targetFile = args[0];
        const node = this.resolveNode(targetFile);
        if (!node) {
          output = `cat: ${targetFile}: No such file or directory`;
          isError = true;
        } else if (node.type === 'dir') {
          output = `cat: ${targetFile}: Is a directory`;
          isError = true;
        } else {
          output = node.content || '';
        }
        break;
      }

      case 'tail':
      case 'head': {
        const filename = args[args.length - 1];
        const countArg = args.find((a) => a.startsWith('-n'));
        const count = countArg ? parseInt(countArg.replace('-n', ''), 10) || 5 : 5;
        const node = this.resolveNode(filename);
        if (!node || node.type !== 'file') {
          output = `${cmd}: cannot open '${filename}' for reading: No such file or directory`;
          isError = true;
        } else {
          const lines = (node.content || '').split('\n');
          output = (cmd === 'tail' ? lines.slice(-count) : lines.slice(0, count)).join('\n');
        }
        break;
      }

      case 'df': {
        output = [
          'Filesystem     1K-blocks      Used Available Use% Mounted on',
          ...this.disks.map(
            (d) =>
              `${d.filesystem.padEnd(14, ' ')} ${d.size.padStart(9, ' ')} ${d.used.padStart(9, ' ')} ${d.avail.padStart(9, ' ')} ${d.usePercent.padStart(4, ' ')} ${d.mount}`
          ),
        ].join('\n');
        break;
      }

      case 'du': {
        const target = args.find((a) => !a.startsWith('-')) || '.';
        const node = this.resolveNode(target);
        if (!node) {
          output = `du: cannot access '${target}': No such file or directory`;
          isError = true;
        } else {
          const isLargeLog = target.includes('error.log') || target.includes('app_debug.log');
          output = isLargeLog
            ? `18G\t${target}`
            : `128K\t${target}`;
        }
        break;
      }

      case 'free': {
        output = [
          '              total        used        free      shared  buff/cache   available',
          'Mem:           3918        1420        1852          12         646        2240',
          'Swap:          2047           0        2047',
        ].join('\n');
        break;
      }

      case 'ps': {
        output = [
          'PID   USER     TIME  COMMAND',
          ...this.processes.map((p) => `${p.pid.toString().padStart(5, ' ')} ${p.user.padEnd(8, ' ')} ${p.time.padEnd(5, ' ')} ${p.command}`),
        ].join('\n');
        break;
      }

      case 'kill':
      case 'pkill': {
        const targetPidOrName = args[args.length - 1];
        if (!targetPidOrName) {
          output = `${cmd}: usage: ${cmd} [PID|NAME]`;
          isError = true;
          break;
        }

        const initialCount = this.processes.length;
        this.processes = this.processes.filter((p) => {
          const matches = p.pid.toString() === targetPidOrName || p.command.includes(targetPidOrName);
          if (matches) {
            // 释放该进程占用的端口
            for (const [port, portInfo] of Object.entries(this.portsState)) {
              if (portInfo.pid === p.pid) {
                delete this.portsState[parseInt(port, 10)];
              }
            }
          }
          return !matches;
        });

        if (this.processes.length === initialCount) {
          output = `${cmd}: (${targetPidOrName}) - No such process`;
          isError = true;
        } else {
          output = ''; // Linux kill 正常退出通常静默
        }
        break;
      }

      case 'rm': {
        const target = args[args.length - 1];
        if (!target) {
          output = 'rm: missing operand';
          isError = true;
          break;
        }
        const removed = this.removeVirtualNode(target);
        if (!removed) {
          output = `rm: cannot remove '${target}': No such file or directory`;
          isError = true;
        } else {
          output = '';
        }
        break;
      }

      case 'mkdir': {
        const target = args[args.length - 1];
        if (!target) {
          output = 'mkdir: missing operand';
          isError = true;
        } else {
          this.writeVirtualFile(this.fileSystem, this.normalizePath(target) + '/.keep', '');
          output = '';
        }
        break;
      }

      case 'touch': {
        const target = args[args.length - 1];
        if (!target) {
          output = 'touch: missing file operand';
          isError = true;
        } else {
          this.writeVirtualFile(this.fileSystem, this.normalizePath(target), '');
          output = '';
        }
        break;
      }

      case 'echo': {
        output = args.join(' ').replace(/["']/g, '');
        break;
      }

      case 'netstat':
      case 'ss': {
        const rows = [
          'Netid  State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port  Process',
          ...Object.entries(this.portsState).map(([port, info]) => {
            return `tcp    LISTEN  0       128          0.0.0.0:${port.padEnd(8, ' ')} 0.0.0.0:*      users:(("${info.service}",pid=${info.pid},fd=4))`;
          }),
        ];
        output = rows.join('\n');
        break;
      }

      case 'curl': {
        const targetUrl = args.find((a) => !a.startsWith('-')) || '';
        const isHead = args.some((a) => a === '-I' || a === '--head');
        const isBackendUp = this.servicesState['backend.service'] === 'active';
        const isNginxUp = this.servicesState['nginx'] === 'active' || this.servicesState['nginx.service'] === 'active';

        if (targetUrl.includes(':8080')) {
          if (isBackendUp) {
            output = isHead
              ? 'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 68\r\n\r\n'
              : '{"status": "healthy", "version": "1.0", "app": "OpsMaster Backend"}';
          } else {
            output = 'curl: (7) Failed to connect to 127.0.0.1 port 8080: Connection refused';
            isError = true;
          }
        } else {
          // 访问 80 / Nginx
          if (isNginxUp) {
            if (isBackendUp) {
              output = isHead
                ? 'HTTP/1.1 200 OK\r\nServer: nginx/1.24.0\r\nContent-Type: application/json\r\nContent-Length: 68\r\nConnection: keep-alive\r\n\r\n'
                : '{"status": "healthy", "version": "1.0", "app": "OpsMaster Backend"}';
            } else {
              output = isHead
                ? 'HTTP/1.1 502 Bad Gateway\r\nServer: nginx/1.24.0\r\nContent-Type: text/html\r\nConnection: keep-alive\r\n\r\n'
                : '<html><head><title>502 Bad Gateway</title></head><body><h1>502 Bad Gateway</h1></body></html>';
              isError = true;
            }
          } else {
            output = 'curl: (7) Failed to connect to 127.0.0.1 port 80: Connection refused';
            isError = true;
          }
        }
        break;
      }

      case 'systemctl': {
        const action = args[0];
        const unit = args[1] || '';

        if (action === 'status') {
          const serviceKey = unit.includes('.') ? unit : `${unit}.service`;
          const isUp = this.servicesState[unit] === 'active' || this.servicesState[serviceKey] === 'active';

          output = [
            `● ${unit} - OpsMaster Managed Service`,
            `     Loaded: loaded (/etc/systemd/system/${unit}; enabled; vendor preset: enabled)`,
            `     Active: ${isUp ? 'active (running)' : 'inactive (dead)'}`,
            ...(isUp ? [`   Main PID: 2154`] : [`    Process: killed`]),
          ].join('\n');
        } else if (action === 'start' || action === 'restart') {
          // 检查是否有端口冲突
          if (unit.includes('nginx') && this.portsState[80] && this.portsState[80].service !== 'nginx') {
            output = `Job for ${unit} failed because address 0.0.0.0:80 is already in use by PID ${this.portsState[80].pid}.`;
            isError = true;
          } else {
            this.servicesState[unit] = 'active';
            if (unit.includes('backend')) {
              this.servicesState['backend.service'] = 'active';
              this.portsState[8080] = { service: 'python3', pid: 2154 };
              if (!this.processes.some((p) => p.pid === 2154)) {
                this.processes.push({ pid: 2154, user: 'admin', time: '0:03', command: 'python3 /opt/api/server.py' });
              }
            } else if (unit.includes('nginx')) {
              this.servicesState['nginx'] = 'active';
              this.portsState[80] = { service: 'nginx', pid: 1042 };
            }
            output = '';
          }
        } else if (action === 'stop') {
          this.servicesState[unit] = 'inactive';
          output = '';
        } else {
          output = `Unknown operation '${action}'.`;
          isError = true;
        }
        break;
      }

      case 'clear':
        output = '__CLEAR__';
        break;

      case 'grep':
        output = '用法: grep [OPTIONS] PATTERN [FILE] 或通过管道传入 (cat file | grep text)';
        break;

      case 'help':
        output = [
          '╔═════════════════════════════════════════════════════════════════╗',
          '║              OpsMaster 虚拟 Linux 实训沙箱内置命令支持          ║',
          '╚═════════════════════════════════════════════════════════════════╝',
          '  ls [-la]             查看目录文件列表',
          '  cd <dir>             切换工作目录 (如 cd /var/log/nginx)',
          '  cat <file>           打印文件文本内容',
          '  head / tail [-n N]   查看文件头部或末尾几行',
          '  grep <pattern>       文本过滤匹配，支持管道: cat app.log | grep error',
          '  df [-h]              查看虚拟磁盘各分区空间占用率',
          '  du [-sh] <dir/file>  查看文件或目录实际占用体积',
          '  free [-m]            查看系统内存与交换空间使用量',
          '  ps [aux]             查看系统当前运行的所有进程与 PID',
          '  kill [-9] <pid>      根据 PID 终止目标异常/恶意进程',
          '  pkill <name>         根据进程名称批量杀死进程',
          '  rm [-rf] <path>      删除文件或目录释放空间',
          '  touch / mkdir        创建空文件或目录',
          '  netstat / ss [-tlnp] 查看网络监听端口与占用进程映射',
          '  systemctl            系统服务控制 (status|start|restart|stop)',
          '  curl [-I] <url>      发起网络请求与 HTTP 头探测探活',
          '  clear                清空屏幕终端',
        ].join('\n');
        break;

      default:
        output = `bash: ${cmd}: command not found (输入 help 查看常用实战排查命令)`;
        isError = true;
        break;
    }

    return { output, isError };
  }

  private executePipeline(pipelineCmd: string): {
    output: string;
    isError?: boolean;
    isPassed?: boolean;
    objectiveStates: boolean[];
  } {
    const parts = pipelineCmd.split('|').map((s) => s.trim());
    let currentInput = '';
    let hasError = false;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const tokens = part.split(/\s+/);
      const cmd = tokens[0];
      const args = tokens.slice(1);

      if (i === 0) {
        const res = this.executeCore(part);
        currentInput = res.output;
        hasError = !!res.isError;
      } else {
        if (cmd === 'grep') {
          const pattern = args.find((a) => !a.startsWith('-')) || '';
          const invert = args.includes('-v');
          const lines = currentInput.split('\n');
          const filtered = lines.filter((line) => {
            const matched = line.toLowerCase().includes(pattern.toLowerCase());
            return invert ? !matched : matched;
          });
          currentInput = filtered.join('\n');
        } else if (cmd === 'tail' || cmd === 'head') {
          const lines = currentInput.split('\n');
          const count = 5;
          currentInput = (cmd === 'tail' ? lines.slice(-count) : lines.slice(0, count)).join('\n');
        } else {
          currentInput = `pipeline error: command '${cmd}' not supported in pipe`;
          hasError = true;
        }
      }
    }

    return this.finishExecution(pipelineCmd, currentInput, hasError);
  }

  private finishExecution(
    lastCommand: string,
    output: string,
    isError?: boolean
  ): {
    output: string;
    isError?: boolean;
    isPassed?: boolean;
    objectiveStates: boolean[];
  } {
    const snapshot: SandboxSnapshot = {
      lastCommand,
      lastOutput: output,
      commandHistory: this.commandHistory,
      currentDir: this.currentPath,
      fileSystem: this.fileSystem,
      servicesState: this.servicesState,
      portsState: this.portsState,
      processes: this.processes,
      disks: this.disks,
    };

    // 使用 EvalEngine 动态评测所有 objectives
    this.objectiveStates = this.evalEngine.evaluateObjectives(snapshot, this.objectiveStates);
    const isPassed = this.evalEngine.isChallengePassed(snapshot, this.objectiveStates);

    return {
      output,
      isError,
      isPassed,
      objectiveStates: this.objectiveStates,
    };
  }
}

