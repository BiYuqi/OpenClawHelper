# OpenClaw Configurator — 产品需求文档 (PRD)

## 1. 产品概述

### 1.1 产品名称
**OpenClaw Configurator** — OpenClaw AI 集成一键配置工具

### 1.2 痛点
OpenClaw 的 AI Provider 配置依赖手动编辑 `~/.openclaw/openclaw.json`（JSON5 格式）。用户需要记住每家厂商的 API 地址、API 协议类型、模型 ID，并手写复杂嵌套 JSON。切换模型也要改文件再重启 Gateway。这个过程对非后端用户极不友好。

### 1.3 产品目标
提供一个 GUI 桌面应用，让用户通过可视化填表完成所有 AI 配置。填完点保存，应用直接改写本地配置文件，零手动 JSON 编辑。

### 1.4 产品形态
Electron 桌面应用（macOS 优先，兼容 Linux/Windows）。

### 1.5 目标用户
已安装或计划安装 OpenClaw 的个人开发者、技术爱好者。

### 1.6 关键链接
- 官网：https://openclaw.ai
- GitHub：https://github.com/openclaw/openclaw
- Twitter/X：https://x.com/openclaw
- 文档：https://docs.openclaw.ai

---

## 2. 页面与功能

应用采用左侧固定侧边栏 + 右侧内容区布局。侧边栏四个导航项，支持中英双语切换（默认中文）：

| 图标 | 中文 | English | 说明 |
|------|------|---------|------|
| 🏠 | 仪表盘 | Dashboard | 总览 + 快捷操作 |
| 🤖 | AI 模型 | Providers | 配置 AI 厂商和模型（核心页） |
| 📋 | 运行日志 | Logs | 实时查看 Gateway 日志 |
| ⚙️ | 系统管理 | Settings | 端口修改、卸载等 |

侧边栏底部放语言切换按钮（中 / EN）。

---

### 2.1 启动检测（进入应用前）

应用启动时自动检测 OpenClaw 安装状态：

**状态 A — 未安装**（配置文件不存在）：
- 大号提示"未检测到 OpenClaw"
- 安装命令展示：`npm install -g openclaw@latest && openclaw onboard --install-daemon`
- 三个外链按钮：官网 / GitHub / Twitter
- 「重新检测」按钮

**状态 B — 已安装但 Gateway 未运行**：
- 提示"Gateway 未启动"，给出启动命令
- 仍可进入配置页编辑（只是无法实时验证）

**状态 C — 一切正常**：
- 自动进入仪表盘

---

### 2.2 仪表盘

展示 OpenClaw 运行概况和快捷操作入口。

**信息卡片**：
- Gateway 状态：运行中 🟢 / 已停止 🔴
- 当前端口号（默认 18789）
- 当前主模型名称
- 已配置的 Provider 数量
- Fallback 模型链

**快捷操作**：
- 「打开 WebChat」→ 浏览器打开 `http://127.0.0.1:{端口}`
- 「打开配置文件」→ 系统编辑器打开 openclaw.json
- 「重启 Gateway」→ 执行重启（需确认弹窗）

---

### 2.3 AI 模型配置页（核心页面）

#### 2.3.1 页面布局

```
┌─────────────────────────────────────────────────┐
│  全局模型设置                                      │
│  主模型: [下拉选择]    Fallback: [可拖拽排序列表]   │
├─────────────────────────────────────────────────┤
│  Provider 卡片列表                                 │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│  │ Anthropic │ │  OpenAI   │ │ DeepSeek  │      │
│  │  🟢 已启用 │ │  ⚪ 未配置 │ │  🟢 已启用 │      │
│  └───────────┘ └───────────┘ └───────────┘      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│  │  Gemini   │ │OpenRouter │ │   Kimi    │      │
│  └───────────┘ └───────────┘ └───────────┘      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│  │ 小米 MiMo │ │ MiniMax   │ │ + 自定义   │      │
│  └───────────┘ └───────────┘ └───────────┘      │
├─────────────────────────────────────────────────┤
│              [保存配置]  [重置]                     │
└─────────────────────────────────────────────────┘
```

#### 2.3.2 支持的 Provider（9 家）

| # | Provider | 说明 | 获取 API Key |
|---|----------|------|-------------|
| 1 | Anthropic | Claude 系列，claude-opus-4-6 / sonnet-4-6 / haiku-4-5 | console.anthropic.com |
| 2 | OpenAI | GPT 系列，gpt-4o / gpt-5.2 / o3-mini | platform.openai.com |
| 3 | DeepSeek | 国产推理，deepseek-chat / deepseek-reasoner | platform.deepseek.com |
| 4 | Google Gemini | gemini-2.5-pro / gemini-2.0-flash | aistudio.google.com |
| 5 | OpenRouter | 多模型聚合路由，openrouter/auto | openrouter.ai |
| 6 | Kimi (Moonshot) | kimi-k2.5 / kimi-k2-thinking | platform.moonshot.cn |
| 7 | 小米 MiMo | mimo-v2-pro / mimo-v2-flash / mimo-v2-omni | platform.xiaomimimo.com |
| 8 | MiniMax | MiniMax-M2.1 | platform.minimaxi.com |
| 9 | 自定义 | 用户手动填写所有信息 | — |

#### 2.3.3 单个 Provider 卡片（展开后）

**基本信息区**：
- 启用/禁用开关
- API Key 输入框（密码模式，带 👁 显示/隐藏），旁边附「获取 Key」外链
- Base URL（预置 Provider 灰显只读，自定义可编辑）
- API 类型（预置自动设置，自定义可选）

**模型列表区**：
- 每个预置模型一行，带勾选框（勾选 = 启用该模型）
- 每个模型可展开设置：别名（alias）、temperature、maxTokens
- 「+ 添加自定义模型」按钮

#### 2.3.4 全局模型设置

位于页面顶部：
- **主模型**（Primary Model）：下拉菜单，选项 = 所有已启用 Provider 的已勾选模型
- **备用模型**（Fallback）：可从已启用模型中添加，支持拖拽排序

#### 2.3.5 保存逻辑

1. 读取现有配置文件
2. **智能合并**：只修改 AI 相关字段（Provider / 模型 / API Key），保留用户的 channels / identity / gateway 等配置原封不动
3. 写回配置文件
4. 弹窗询问"是否重启 Gateway 使配置生效？"

---

### 2.4 运行日志页

实时查看 OpenClaw Gateway 的运行日志，类似终端 `tail -f` 的 GUI 版本。

#### 工具栏
- 开始 / 暂停按钮
- 清屏按钮
- 日志级别筛选下拉（DEBUG / INFO / WARN / ERROR，默认 INFO 及以上）
- 关键字搜索框（实时过滤 subsystem 和 msg）

#### 日志流区域
- 每行：时间 | 级别徽章（彩色） | 子系统标签 | 消息内容
- 级别颜色：DEBUG 灰、INFO 蓝、WARN 黄、ERROR 红
- 点击子系统标签 → 快捷过滤只显示该子系统
- 点击任意一行可展开查看完整原始 JSON 数据

#### 滚动行为
- 默认自动滚动到底部（跟踪最新日志）
- 用户向上滚动 → 暂停自动滚动 → 显示浮动按钮"↓ N 条新日志"
- 点击浮动按钮 → 回到底部 + 恢复自动滚动

#### 性能要求
- 前端最多保留 10,000 条日志，超出丢弃最早的
- 使用虚拟列表，万条日志不卡顿

#### 底部状态栏
- 已加载日志条数
- 当前日志文件路径

---

### 2.5 系统管理页

#### 2.5.1 端口修改
- 显示当前 Gateway 端口
- 可修改端口并写回配置（需确认弹窗）

#### 2.5.2 卸载 OpenClaw

**展示信息**：
- `~/.openclaw/` 目录大小
- 将要清理的内容（npm 包、配置目录、系统服务）
- 复选框：是否保留配置文件备份

**卸载流程**：
1. 点击「卸载 OpenClaw」
2. 二次确认弹窗：要求输入 `UNINSTALL`
3. 分步执行：停止服务 → 移除系统服务 → 卸载 CLI → 清理数据
4. 每步显示执行状态（✅ / ❌）
5. 完成后跳转"未安装"引导页

---

## 3. 设计规范

### 3.1 视觉风格
- 暗色主题为主（OpenClaw 社区风格）
- OpenClaw 品牌元素：龙虾 🦞、珊瑚红/橙系品牌色
- 卡片式布局，圆角，微妙阴影

### 3.2 交互原则
- API Key 输入后暂存内存，点「保存」才写文件
- Provider 卡片默认收起，点击展开
- 所有破坏性操作需二次确认（修改端口、卸载、重启 Gateway）
- 保存后展示 diff 预览（改了哪些字段）
- Toast 通知反馈操作结果

### 3.3 多语言
- 中文 / English 双语，默认中文
- 侧边栏底部切换

---

## 4. 开发里程碑

### Phase 1 — 基础骨架（Day 1-2）
- [ ] 项目脚手架 + IPC 通信
- [ ] 侧边栏 + 页面路由
- [ ] 启动检测页
- [ ] 配置文件读写

### Phase 2 — AI 模型配置页（Day 3-5）
- [ ] Provider 预置数据
- [ ] ProviderCard 组件
- [ ] 全局模型设置
- [ ] 配置智能合并 + 保存 + 重启

### Phase 3 — 仪表盘 + 日志 + 系统管理（Day 6-8）
- [ ] 仪表盘信息 + 快捷操作
- [ ] 实时日志（流式 + 虚拟滚动 + 过滤 + 搜索）
- [ ] 系统管理（端口 + 卸载）

### Phase 4 — 打磨（Day 9-11）
- [ ] 暗色主题 + 品牌视觉
- [ ] 中英双语
- [ ] Diff 预览 + Toast + 错误处理
- [ ] 打包分发（macOS DMG）
