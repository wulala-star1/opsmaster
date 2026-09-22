import { Challenge } from '../types/challenge';

export const challenges: Challenge[] = [
  // 关卡 0: 零基础入门手把手教学 (Tutorial)
  {
    id: 'tutorial-linux-basics',
    title: '手把手新手课：Linux 目录与文件实操极速入门',
    dimension: 'core_tools',
    difficulty: 'L1_EASY',
    type: 'tutorial',
    tagline: 'Linux 新手第一课！从零掌握路径导航、文件创建与输出查看三大基础动作。',
    scenarioMarkdown: `**【新手运维实训课堂】**
欢迎来到 OpsMaster 运维学院！本关专为零基础设计，手把手带领你掌握 Linux 环境下的三大高频动作：
1. 查看当前所处路径与文件列表；
2. 创建项目工作目录与新脚本文件；
3. 向文件写入代码并打印查看。`,
    objectives: [
      { id: 'obj-t-1', text: '使用 ls -la 查看当前工作目录下的所有文件（含隐藏文件）', ruleIndex: 0 },
      { id: 'obj-t-2', text: '使用 mkdir 创建目录 /root/my_ops 并用 touch 创建 app.sh', ruleIndex: 1 },
      { id: 'obj-t-3', text: '使用 echo 将内容写入 app.sh 并用 cat 查看', ruleIndex: 2 },
    ],
    initialDir: '/root',
    initialFiles: {
      '/root/.bashrc': '# OpsMaster Bash Profile\nexport PS1="\\u@\\h:\\w# "\n',
      '/root/readme.txt': '欢迎来到 Linux 世界！按照左侧教学向导步骤开始实操练习吧。',
    },
    evalRules: [
      {
        type: 'stdout_contains',
        target: 'ls',
        expectedSnippet: '.bashrc',
        hintOnFail: '请输入 ls -la 查看所有文件',
      },
      {
        type: 'file_state',
        target: '/root/my_ops/app.sh',
        expectedState: 'exists',
        hintOnFail: '请使用 mkdir -p /root/my_ops && touch /root/my_ops/app.sh 创建文件',
      },
      {
        type: 'stdout_contains',
        target: 'cat',
        expectedSnippet: 'OpsMaster',
        hintOnFail: '请使用 echo "echo OpsMaster" > /root/my_ops/app.sh 并 cat 查看',
      },
    ],
    tutorialGuide: [
      {
        stepIndex: 1,
        title: '查看文件系统与隐藏文件',
        conceptExplanation: 'Linux 采用树状文件层次结构（FHS）。以点“.”开头的文件为隐藏文件（通常是系统与用户配置文件）。使用 ls 命令可列出文件，配合参数可查看详细权限与大小。',
        recommendedCommand: 'ls -la',
        commandBreakdown: [
          { flag: '-l', meaning: 'Long format，以长列表形式显示权限、所有者与文件大小' },
          { flag: '-a', meaning: 'All files，包含以“.”开头的隐藏配置文件' },
        ],
        expectedResultHint: '终端将输出 drwxr-xr-x 权限格式的清单，注意观察其中的 .bashrc 隐藏文件。',
      },
      {
        stepIndex: 2,
        title: '创建工作目录与空文件',
        conceptExplanation: '在生产部署时，我们通常在指定路径下建立专属工作目录。mkdir 用于新建文件夹（-p 支持递归创建多级父目录），touch 用于新建空文件或更新已有文件的时间戳。',
        recommendedCommand: 'mkdir -p /root/my_ops && touch /root/my_ops/app.sh',
        commandBreakdown: [
          { flag: 'mkdir -p', meaning: '若父级目录不存在则自动一并递归创建，避免报错' },
          { flag: '&&', meaning: 'Shell 逻辑与，代表前一条命令执行成功后紧接着执行后一条' },
          { flag: 'touch', meaning: '快速在指定路径创建一个大小为 0 字节的空文件' },
        ],
        expectedResultHint: 'Linux 成功执行通常保持静默（无报错即成功）。完成后可用 ls /root/my_ops 验证。',
      },
      {
        stepIndex: 3,
        title: '文本写入与内容查看',
        conceptExplanation: '输出重定向符“>”可以将标准输出（stdout）流向并覆盖写入目标文件；“>>”为追加写入。cat（concatenate）是查看文本文件内容最常用的基础工具。',
        recommendedCommand: 'echo "echo OpsMaster Ready" > /root/my_ops/app.sh && cat /root/my_ops/app.sh',
        commandBreakdown: [
          { flag: 'echo', meaning: '将字符串打印到标准输出' },
          { flag: '>', meaning: '重定向覆盖写入指定文件' },
          { flag: 'cat', meaning: '读取并打印文件全部文本到终端屏幕' },
        ],
        expectedResultHint: '终端将在下一行打印出刚才写入的文本 "echo OpsMaster Ready"，判定即可通过！',
      },
    ],
    socraticPrompt: '引导用户熟悉最基本的 ls、cd、touch 和 cat 命令的使用。',
    rewardExp: 80,
    rewardRadar: { kernel: 6, troubleshooting: 4 },
  },

  // 关卡 1: 502 Bad Gateway 生产事故排查 (War Room)
  {
    id: 'war-room-502-bad-gateway',
    title: '502 Bad Gateway 生产故障排查',
    dimension: 'troubleshooting',
    difficulty: 'L2_MEDIUM',
    type: 'war_room',
    tagline: '网关全面阻断，顺着反代链路揪出上游挂死的根因！',
    scenarioMarkdown: `**【紧急生产事故单】**
报警时间：10:45:00
报警现象：外部调用系统接口全部报 \`502 Bad Gateway\`，核心业务不可用。
排查提示：请通过查看 Nginx 错误日志、排查端口与后端服务状态，定位问题并将服务拉起恢复。最后通过网络测试验证。`,
    objectives: [
      { id: 'obj-1', text: '查看 /var/log/nginx/error.log 确定上游异常原因', ruleIndex: 0 },
      { id: 'obj-2', text: '排查后端 8080 端口与 backend.service 状态并拉起服务', ruleIndex: 1 },
      { id: 'obj-3', text: '使用 curl -I 验证接口已恢复 HTTP 200 OK', ruleIndex: 2 },
    ],
    initialDir: '/root',
    initialFiles: {
      '/etc/nginx/nginx.conf': `events {}\nhttp {\n    upstream backend_pool {\n        server 127.0.0.1:8080;\n    }\n    server {\n        listen 80;\n        location / {\n            proxy_pass http://backend_pool;\n            proxy_connect_timeout 2s;\n        }\n    }\n}`,
      '/etc/systemd/system/backend.service': `[Unit]\nDescription=OpsMaster Python API Backend\nAfter=network.target\n\n[Service]\nExecStart=/usr/bin/python3 /opt/api/server.py\nRestart=always\n\n[Install]\nWantedBy=multi-user.target`,
      '/var/log/nginx/error.log': `2026/09/22 10:45:01 [error] 1042#1042: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.105, server: _, request: "GET / HTTP/1.1", upstream: "http://127.0.0.1:8080/", host: "opsmaster.local"\n2026/09/22 10:45:04 [error] 1042#1042: *2 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.106, server: _, request: "GET /api/status HTTP/1.1", upstream: "http://127.0.0.1:8080/api/status", host: "opsmaster.local"`,
      '/opt/api/server.py': `# OpsMaster Sample Web Service\nfrom http.server import HTTPServer, BaseHTTPRequestHandler\n\nclass Handler(BaseHTTPRequestHandler):\n    def do_GET(self):\n        self.send_response(200)\n        self.end_headers()\n        self.wfile.write(b'{"status": "healthy", "version": "1.0", "app": "OpsMaster Backend"}')\n\nif __name__ == '__main__':\n    print("Starting on port 8080...")\n    HTTPServer(('127.0.0.1', 8080), Handler).serve_forever()\n`,
    },
    initialServices: {
      'nginx': 'active',
      'backend.service': 'inactive',
    },
    initialPorts: {
      80: { service: 'nginx', pid: 1042 },
    },
    evalRules: [
      {
        type: 'stdout_contains',
        target: 'error.log',
        expectedSnippet: 'Connection refused',
        hintOnFail: '请使用 cat 或 tail 查看 /var/log/nginx/error.log',
      },
      {
        type: 'service_state',
        target: 'backend.service',
        expectedState: 'active',
        hintOnFail: '请使用 systemctl start backend.service 启动后端服务',
      },
      {
        type: 'stdout_contains',
        target: 'curl',
        expectedSnippet: '200 OK',
        hintOnFail: '请使用 curl -I http://127.0.0.1 验证服务已恢复 200 OK',
      },
    ],
    tutorialGuide: [
      {
        stepIndex: 1,
        title: '反向代理错误日志定位',
        conceptExplanation: '502 Bad Gateway 意味着 Nginx 作为反向代理，在尝试连接下游 upstream（上游应用服务）时遭到了网络拒绝或超时。排查第一法则：永远先看 /var/log/nginx/error.log。',
        recommendedCommand: 'cat /var/log/nginx/error.log',
        commandBreakdown: [
          { flag: 'cat', meaning: '查看文件内容' },
          { flag: 'error.log', meaning: 'Nginx 核心错误日志文件路径' },
        ],
        expectedResultHint: '重点寻找 "connect() failed (111: Connection refused)" 以及后面标注的目标端口 8080。',
      },
      {
        stepIndex: 2,
        title: '排查并拉起挂死的后端应用',
        conceptExplanation: '通过步骤 1 发现 8080 端口连接被拒，说明后端 Web 进程挂死。Linux 下使用 systemd 统一管理系统与应用服务。我们需要检查并启动 backend.service。',
        recommendedCommand: 'systemctl start backend.service',
        commandBreakdown: [
          { flag: 'systemctl', meaning: '控制 systemd 系统和服务管理器' },
          { flag: 'start', meaning: '启动指定的服务单元' },
          { flag: 'backend.service', meaning: '后端 Python 应用对应的 Systemd 配置文件' },
        ],
        expectedResultHint: '命令静默执行成功后，可用 ss -tlnp 观察 8080 端口是否已出现监听。',
      },
      {
        stepIndex: 3,
        title: '网络探活与状态码验证',
        conceptExplanation: '后端拉起后，必须通过客户端视角验证全链路连通性。curl 是 Linux 命令行最权威的 HTTP 探活工具，加 -I 参数可以只打印响应头，快速确认 HTTP 状态码是否为 200 OK。',
        recommendedCommand: 'curl -I http://127.0.0.1',
        commandBreakdown: [
          { flag: '-I / --head', meaning: '仅请求 HTTP Response 头部信息，不打印正文' },
          { flag: 'http://127.0.0.1', meaning: '请求本机的 Nginx 网关入口 (80端口)' },
        ],
        expectedResultHint: '首行应返回 "HTTP/1.1 200 OK"，证明反代成功转送并通关！',
      },
    ],
    socraticPrompt: '引导用户先从日志入手，观察 connect() 失败的端口，再去检查 8080 端口对应的服务状态。',
    rewardExp: 120,
    rewardRadar: { troubleshooting: 8, network: 5 },
  },

  // 关卡 2: 生产磁盘空间 100% 爆满故障排查 (War Room)
  {
    id: 'war-room-disk-full',
    title: '生产环境磁盘 100% 爆满紧急清理',
    dimension: 'troubleshooting',
    difficulty: 'L2_MEDIUM',
    type: 'war_room',
    tagline: '生产告警 /var 分区已达 100%，数据库与应用无法写入，迅速定位并清理！',
    scenarioMarkdown: `**【紧急运维告警】**
告警级别：P1 紧急
告警内容：主机 node-prod-02 的 \`/var\` 分区磁盘使用率已达 100%，许多核心进程无法写入日志面临崩溃风险！
排查提示：
1. 请先使用 \`df -h\` 查看磁盘挂载情况确认爆满分区；
2. 切换至对应目录，使用 \`du -sh *\` 揪出异常膨胀的超大死循环日志文件；
3. 使用 \`rm\` 或重定向清空异常超大文件，使磁盘使用率恢复到健康阈值。`,
    objectives: [
      { id: 'obj-disk-1', text: '使用 df -h 确认 /var 分区磁盘使用率', ruleIndex: 0 },
      { id: 'obj-disk-2', text: '使用 du 定位 /var/log 下膨胀的大日志文件', ruleIndex: 1 },
      { id: 'obj-disk-3', text: '清理该膨胀大日志，使 /var 分区使用率恢复正常 (<= 25%)', ruleIndex: 2 },
    ],
    initialDir: '/root',
    initialFiles: {
      '/var/log/app_debug.log': 'FATAL ERROR: Memory leak stacktrace detected...\n' + 'Repeating error dump...\n'.repeat(500),
      '/var/log/syslog': 'Sep 22 10:00:00 node kernel: [OK] system healthy\n',
    },
    initialDisks: [
      { filesystem: '/dev/vda1', size: '40G', used: '8.2G', avail: '31.8G', usePercent: '21%', mount: '/' },
      { filesystem: '/dev/vda2', size: '20G', used: '20G', avail: '0G', usePercent: '100%', mount: '/var' },
    ],
    evalRules: [
      {
        type: 'stdout_contains',
        target: 'df',
        expectedSnippet: '/var',
        hintOnFail: '请使用 df -h 查看磁盘挂载情况',
      },
      {
        type: 'stdout_contains',
        target: 'du',
        expectedSnippet: 'app_debug.log',
        hintOnFail: '请使用 du -sh /var/log/* 寻找导致空间爆满的超大文件',
      },
      {
        type: 'disk_state',
        target: '/var',
        maxDiskUsagePercent: 25,
        hintOnFail: '请使用 rm /var/log/app_debug.log 删除该异常大文件',
      },
    ],
    tutorialGuide: [
      {
        stepIndex: 1,
        title: '全局查看分区挂载与使用率',
        conceptExplanation: 'Linux 磁盘排障第一步是定位“究竟是哪一个物理挂载点满了”。df（disk filesystem）可以报告文件系统的总容量、已用、可用以及使用率百分比。-h 代表以人类易读的 G/M 为单位。',
        recommendedCommand: 'df -h',
        commandBreakdown: [
          { flag: 'df', meaning: 'Disk Free，查看文件系统空间占用' },
          { flag: '-h', meaning: 'Human-readable，以 K, M, G 规范显示字节大小' },
        ],
        expectedResultHint: '在输出中查看 Mounted on 为 /var 的行，其 Use% 显示为 100%。',
      },
      {
        stepIndex: 2,
        title: '下钻定位超大异常日志',
        conceptExplanation: '定位到 /var 分区满后，我们需要进入该目录，使用 du（disk usage）估算每个子目录和文件的实际占用。生产中通常是死循环堆栈日志爆满引起。',
        recommendedCommand: 'du -sh /var/log/*',
        commandBreakdown: [
          { flag: 'du', meaning: 'Disk Usage，统计文件或目录所占空间' },
          { flag: '-s', meaning: 'Summary，仅显示每个参数的总计值，不递归逐层列出' },
          { flag: '-h', meaning: 'Human-readable，以 G/M 为单位' },
        ],
        expectedResultHint: '输出显示 /var/log/app_debug.log 高达 18G，锁定了元凶文件！',
      },
      {
        stepIndex: 3,
        title: '安全清理并释放磁盘块',
        conceptExplanation: '在生产中，对于异常膨胀的死循环日志，确认非核心归档后使用 rm 删除，或使用 > app_debug.log 快速清空，让操作系统回收 inode 和磁盘数据块。',
        recommendedCommand: 'rm /var/log/app_debug.log',
        commandBreakdown: [
          { flag: 'rm', meaning: 'Remove，从文件系统中删除指定文件' },
        ],
        expectedResultHint: '删除后可再次执行 df -h，/var 分区使用率立即下降至 19%，完成故障修复！',
      },
    ],
    socraticPrompt: '引导用户先用 df -h 定位哪块分区满了，然后到该分区目录下用 du -sh * 排查最大的文件或目录并进行安全清理。',
    rewardExp: 140,
    rewardRadar: { storage: 10, troubleshooting: 6 },
  },

  // 关卡 3: 80 端口被非法恶意进程占用 (Terminal Lab)
  {
    id: 'lab-port-conflict',
    title: '80 端口冲突与僵尸进程处置',
    dimension: 'services',
    difficulty: 'L2_MEDIUM',
    type: 'terminal_lab',
    tagline: 'Nginx 启动失败提示端口占用！查出恶意占用的 PID 并强行终止拉起服务。',
    scenarioMarkdown: `**【实训场景】**
你正在部署生产 Nginx 服务，执行 \`systemctl start nginx\` 时报错：
\`Job for nginx failed because address 0.0.0.0:80 is already in use by PID 4412\`。
排查目标：
1. 使用 \`ss -tlnp\` 或 \`netstat\` 确认 80 端口被哪个异常 PID 占用；
2. 使用 \`ps aux\` 观察该进程的来历，并使用 \`kill -9 <PID>\` 彻底终止它；
3. 重新启动 Nginx 服务并测试其监听状态。`,
    objectives: [
      { id: 'obj-port-1', text: '使用 ss -tlnp 或 netstat 确认 80 端口占用的异常 PID', ruleIndex: 0 },
      { id: 'obj-port-2', text: '使用 kill 终止异常占用 80 端口的进程', ruleIndex: 1 },
      { id: 'obj-port-3', text: '启动 nginx 服务并恢复正常监听', ruleIndex: 2 },
    ],
    initialDir: '/root',
    initialFiles: {
      '/etc/nginx/nginx.conf': 'events {}\nhttp {\n    server {\n        listen 80;\n        location / { return 200 "OpsMaster OK"; }\n    }\n}',
    },
    initialServices: {
      'nginx': 'inactive',
    },
    initialPorts: {
      80: { service: 'unknown_miner', pid: 4412 },
    },
    initialProcesses: [
      { pid: 1, user: 'root', time: '0:01', command: '/sbin/init' },
      { pid: 4412, user: 'guest', time: '12:30', command: '/tmp/.miner/unknown_miner --port 80' },
    ],
    evalRules: [
      {
        type: 'stdout_contains',
        target: 'ss',
        expectedSnippet: '4412',
        hintOnFail: '请使用 ss -tlnp 或 netstat 查看 80 端口占用详情',
      },
      {
        type: 'process_state',
        target: '4412',
        expectedState: 'stopped',
        hintOnFail: '请使用 kill 4412 或 kill -9 4412 终止该异常占用进程',
      },
      {
        type: 'service_state',
        target: 'nginx',
        expectedState: 'active',
        hintOnFail: '请使用 systemctl start nginx 启动 Nginx 服务',
      },
    ],
    tutorialGuide: [
      {
        stepIndex: 1,
        title: '网络端口与进程映射排查',
        conceptExplanation: '当服务报 Address already in use 时，意味着操作系统的 TCP 协议栈中该端口已经被其他 Socket bind 占用。现代 Linux 推荐使用 ss（Socket Statistics，相比 netstat 更快更轻量），通过 -tlnp 打印所有正在监听的 TCP 端口及拥有者的 PID。',
        recommendedCommand: 'ss -tlnp',
        commandBreakdown: [
          { flag: '-t', meaning: 'TCP sockets' },
          { flag: '-l', meaning: 'Listening 监听状态' },
          { flag: '-n', meaning: 'Numeric 纯数字显示端口号，不反查域名' },
          { flag: '-p', meaning: 'Process 显示绑定此端口的进程名与 PID' },
        ],
        expectedResultHint: '在输出中寻找 0.0.0.0:80，右侧会明确打印 pid=4412 以及非法进程名 unknown_miner。',
      },
      {
        stepIndex: 2,
        title: '强制终止冲突进程释放端口',
        conceptExplanation: '排查出 PID 为 4412 的恶意挖矿木马后，需要向该进程发送信号（Signal）。使用 kill -9 会发送 SIGKILL，由内核无条件收回其执行权与所有绑定的网络端口。',
        recommendedCommand: 'kill -9 4412',
        commandBreakdown: [
          { flag: '-9', meaning: 'SIGKILL 强杀信号，不可被进程阻塞或忽略' },
          { flag: '4412', meaning: '目标占用进程的 PID' },
        ],
        expectedResultHint: '命令静默成功后，80 端口随即被操作系统协议栈释放。',
      },
      {
        stepIndex: 3,
        title: '正常启动 Nginx 服务',
        conceptExplanation: '端口释放后，再次通过 systemctl 启动 nginx.service。Nginx master process 会顺利 bind 80 端口，服务恢复 healthy。',
        recommendedCommand: 'systemctl start nginx',
        commandBreakdown: [
          { flag: 'systemctl', meaning: '系统服务控制器' },
          { flag: 'start nginx', meaning: '启动 Web 服务器' },
        ],
        expectedResultHint: '服务拉起成功，再次运行 ss -tlnp 将看到 80 端口已被 nginx 正规接管！',
      },
    ],
    socraticPrompt: '先引导用户查看 80 端口对应的 PID，再通过 ps 查看该进程的命令，最后 kill 终止并启动 nginx。',
    rewardExp: 110,
    rewardRadar: { network: 8, security: 6 },
  },

  // 关卡 4: Nginx 访问日志高频恶意 IP 统计 (Terminal Lab)
  {
    id: 'lab-log-grep-awk',
    title: 'Linux 三剑客：访问日志恶意攻击分析',
    dimension: 'core_tools',
    difficulty: 'L1_EASY',
    type: 'terminal_lab',
    tagline: '利用 Linux 核心管道与 grep 过滤工具，从海量日志中排查攻击者特征！',
    scenarioMarkdown: `**【运维数据分析场景】**
安全组收到告警：近期有外部恶意扫描器正在对网站爆破探测后台接口，并在 access.log 留下了大量 404 / 500 记录。
任务要求：
1. 进入 \`/var/log/nginx\` 目录；
2. 使用 \`cat access.log | grep 404\` 过滤出所有探测失败的记录；
3. 统计出正在发起扫描的攻击源 IP。`,
    objectives: [
      { id: 'obj-log-1', text: '切换至 /var/log/nginx 目录', ruleIndex: 0 },
      { id: 'obj-log-2', text: '使用管道 cat access.log | grep 404 过滤扫描特征', ruleIndex: 1 },
    ],
    initialDir: '/root',
    initialFiles: {
      '/var/log/nginx/access.log': [
        '192.168.1.100 - - [22/Sep/2026:10:00:01] "GET /index.html HTTP/1.1" 200 4500',
        '203.0.113.45 - - [22/Sep/2026:10:00:02] "GET /admin.php HTTP/1.1" 404 153',
        '203.0.113.45 - - [22/Sep/2026:10:00:03] "GET /wp-login.php HTTP/1.1" 404 153',
        '203.0.113.45 - - [22/Sep/2026:10:00:04] "GET /.env HTTP/1.1" 404 153',
        '192.168.1.101 - - [22/Sep/2026:10:00:05] "GET /api/user HTTP/1.1" 200 230',
      ].join('\n'),
    },
    evalRules: [
      {
        type: 'command_executed',
        target: 'cd /var/log/nginx',
        hintOnFail: '请使用 cd /var/log/nginx 切换到日志目录',
      },
      {
        type: 'stdout_contains',
        target: 'grep',
        expectedSnippet: '404',
        hintOnFail: '请使用 cat access.log | grep 404 筛选探测特征',
      },
    ],
    tutorialGuide: [
      {
        stepIndex: 1,
        title: '切换至目标日志目录',
        conceptExplanation: '在运维日常中，进入日志目录操作可以避免在命令中反复输入长长的绝对路径。cd（change directory）用于切换当前工作目录。',
        recommendedCommand: 'cd /var/log/nginx',
        commandBreakdown: [
          { flag: 'cd', meaning: 'Change Directory 切换目录' },
          { flag: '/var/log/nginx', meaning: 'Nginx 服务标准日志存放根路径' },
        ],
        expectedResultHint: '终端命令行前面的路径将变为 /var/log/nginx。',
      },
      {
        stepIndex: 2,
        title: '利用管道与 grep 过滤特征',
        conceptExplanation: '管道“|”是 Unix/Linux 哲学的灵魂，它将前一个命令的标准输出直接导向后一个命令的标准输入。搭配 grep 正则过滤，能快速从几万行日志中筛选出状态码为 404 的恶意扫描请求。',
        recommendedCommand: 'cat access.log | grep 404',
        commandBreakdown: [
          { flag: 'cat access.log', meaning: '读取日志文本' },
          { flag: '|', meaning: '管道传送' },
          { flag: 'grep 404', meaning: '只保留包含 404 字符串的行' },
        ],
        expectedResultHint: '终端将过滤出 203.0.113.45 请求 /admin.php、/wp-login.php、/.env 的三行攻击记录。',
      },
    ],
    socraticPrompt: '引导用户通过管道组合 cat 和 grep 来过滤 HTTP 状态码 404，从而观察攻击者的请求路径与 IP。',
    rewardExp: 90,
    rewardRadar: { kernel: 4, security: 8 },
  },

  // 关卡 5: Linux 核心信号与优雅停机 (Flashcard)
  {
    id: 'flash-linux-signals',
    title: '闪卡速记：Linux 信号控制与优雅停机',
    dimension: 'core_tools',
    difficulty: 'L1_EASY',
    type: 'flashcard',
    tagline: 'SIGTERM 15 还是 SIGKILL 9？面试与生产必备的核心进程信号解析！',
    scenarioMarkdown: `**【微课速记】**
在生产运维与 Kubernetes 缩容时，理解进程信号至关重要。
当执行 \`kill <pid>\` 与 \`kill -9 <pid>\` 时，操作系统底层有何本质区别？`,
    objectives: [
      { id: 'obj-flash-1', text: '完成信号处理与优雅停机核心概念选择题', ruleIndex: 0 },
    ],
    initialDir: '/root',
    initialFiles: {},
    evalRules: [
      {
        type: 'command_executed',
        target: 'flashcard_completed',
        hintOnFail: '请完成闪卡测验',
      },
    ],
    flashcardData: {
      question: '在生产环境中进行服务优雅停机（Graceful Shutdown）时，应优先发送哪种信号给进程？',
      scenario: '某微服务正在处理正在写入数据库的交易订单，运维人员需要将其平滑下线更新版本。',
      options: [
        { key: 'A', text: 'SIGKILL (9) - 强制无条件杀死进程，回收所有资源' },
        { key: 'B', text: 'SIGTERM (15) - 请求进程平滑终止，允许进程执行清理逻辑与保存状态' },
        { key: 'C', text: 'SIGINT (2) - 终端中断信号，仅用于键盘按下 Ctrl+C' },
        { key: 'D', text: 'SIGSTOP (19) - 暂停进程运行，等待 SIGCONT 恢复' },
      ],
      correctAnswer: 'B',
      explanation: 'SIGTERM (信号 15) 是默认的终止信号，它允许进程捕获并执行“收尾工作”（如关闭网络连接、处理完正在进行的事务、释放锁）。而 SIGKILL (信号 9) 会被操作系统内核直接接管并强制销毁进程，进程无法捕获，极易导致正在写入的数据损坏或事务中断！因此生产实践永远优先 SIGTERM，超时未退出才考虑 SIGKILL。',
      keyTakeaway: 'K8s 容器终止流程同样遵循此规范：先发送 SIGTERM，等待 terminationGracePeriodSeconds (默认 30s)，若未退出才发 SIGKILL。',
    },
    socraticPrompt: '引导用户对比 SIGTERM (可被捕获清理) 与 SIGKILL (内核强杀不可捕获) 的差异。',
    rewardExp: 80,
    rewardRadar: { kernel: 8, troubleshooting: 4 },
  },

  // 关卡 6: Kubernetes Pod 异常诊断 (Flashcard)
  {
    id: 'flash-k8s-pod-status',
    title: '闪卡速记：Kubernetes Pod 核心状态诊断',
    dimension: 'modern_devops',
    difficulty: 'L2_MEDIUM',
    type: 'flashcard',
    tagline: 'CrashLoopBackOff 与 OOMKilled 的根因与排错第一手指令！',
    scenarioMarkdown: `**【云原生排障】**
在生产 K8s 集群中，Pod 状态显示 \`CrashLoopBackOff\` 是最常见的故障之一。
作为运维工程师，你该如何准确定位根因？`,
    objectives: [
      { id: 'obj-flash-2', text: '掌握 K8s CrashLoopBackOff 的第一排查指令与原因分析', ruleIndex: 0 },
    ],
    initialDir: '/root',
    initialFiles: {},
    evalRules: [
      {
        type: 'command_executed',
        target: 'flashcard_completed',
        hintOnFail: '请完成闪卡测验',
      },
    ],
    flashcardData: {
      question: '当 kubectl get pods 发现某 Pod 状态处于 CrashLoopBackOff 时，以下哪项是排查根因最有效的第一条指令？',
      scenario: '应用刚刚部署到线上集群，Pod 启动几秒后立即退出并不断循环重启。',
      options: [
        { key: 'A', text: 'kubectl delete pod <pod-name> 强行删除让其重建' },
        { key: 'B', text: 'kubectl logs <pod-name> --previous 查看容器上次崩溃前的标准输出日志' },
        { key: 'C', text: 'kubectl scale deployment --replicas=0 将副本数清零' },
        { key: 'D', text: 'kubectl top pod 查看该 Pod 的 CPU 实时消耗' },
      ],
      correctAnswer: 'B',
      explanation: 'CrashLoopBackOff 意味着容器启动后非正常退出（Exit Code != 0），K8s 正在根据重启策略以指数退避时间不断重试启动。此时容器可能已经死亡，使用 kubectl logs --previous 可以抓取到容器上次退出前打印在控制台的 panic 或报错堆栈；配合 kubectl describe pod 查看 Events（如探针失败或 OOMKilled）是排查该问题的黄金标准。',
      keyTakeaway: 'CrashLoopBackOff 排障双板斧：1. kubectl describe pod <pod> 看 Events 与 Exit Code；2. kubectl logs <pod> --previous 看崩溃堆栈。',
    },
    socraticPrompt: '引导用户思考为什么普通 logs 可能抓不到已死容器日志，而 --previous 可以抓到上一次退出的日志。',
    rewardExp: 90,
    rewardRadar: { container: 10, troubleshooting: 6 },
  },
];

export const sampleChallenge = challenges[0];


