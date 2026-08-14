# dsh-claude-theme — Claude 风格主题插件（DSH Web UI）

把 DSH Web 界面改为 **Claude 风格**：象牙白背景、赤陶色（terracotta）主色、暖灰文字，
浅色 / 深色两套色板；可选 **Claude 伪装**，把界面中的 DeepSeek 品牌元素
（logo/词标、页面标题、favicon、品牌文本）替换为 Claude，全部可逆。

这是一个**静态 client 插件包**：以 bundle 层挂载，随 `dsh web` 启动加载。
在 **设置 → "Claude 主题"** tab 内有两个开关，切换**即时生效、免重启免刷新**：

| 开关 | 存储 | 说明 |
| --- | --- | --- |
| Claude 风格主题 | host 设置命名空间 `claude-theme.{enabled}` | 暖色主题，持久化 |
| Claude 伪装 | localStorage `dsh-claude-theme.disguise` | DeepSeek → Claude 品牌替换，可随时还原 |

## 给 Agent 的安装 Prompt（一键复制）

把下面代码块整段发给任意 AI 助手（能读写文件、执行命令的编码 agent），它即可完成安装：

````text
请把 dsh-claude-theme 安装为 DSH web profile 的插件（官方 CLI 方式）。
包源码位于 <本仓库路径>/claude-theme/（package.json 声明了 dsh.bundle.patch
和 dsh.client；lib/index.js 为 Node 半区，lib/client.js 为浏览器半区）。

步骤：

1. 安装并自动挂载（无需手改任何 composition 文件）：
   - 本地包：`dsh plugin --profile web add file:<本仓库路径>/claude-theme`
   - 已发布到 npm：`dsh plugin --profile web add dsh-claude-theme@<版本>`
   CLI 的 bundle 协调会读取包内 dsh.bundle.patch 声明，把包名自动追加到
   profile package.json 的 dsh.profile.bundles，下次启动即挂载。
   ⚠️ 不要手动改 cordis.patch.yml 或手拷 node_modules——官方命令一步到位。

2. 校验：`dsh --profile web --dump-config`，确认输出含
   `# == dsh-claude-theme` 层和 `- id: claude-theme / name: dsh-claude-theme`
   且无报错（该命令会写 profile 的 cordis.yml，需要目录写权限）。

3. 重启 dsh web（首次挂载需要；之后仅更新 client bundle 时只需刷新页面）：
   - ⚠️ 若 agent 自身就跑在 dsh web 进程里，直接杀进程会杀掉自己。
     用 `setsid -f` 启动一个脱离脚本：先 `kill -TERM` 旧进程（含 npm exec /
     sh / node 三层，超时再 `-KILL`），等 3080 端口释放后
     `nohup setsid <dsh bin> web` 重新拉起。
   - ⚠️ 从 agent 沙箱内启动的重启脚本会继承文件访问限制，新实例可能因
     EACCES 写 cordis.yml 崩溃——需要以完全权限（danger-full-access）
     启动脚本，或直接请用户手动重启。

4. 验证：
   - `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3080/plugins/dsh-claude-theme/client.js` → 200；
   - 设置 → "Claude 主题" tab 出现，含「Claude 风格主题」与「Claude 伪装」
     两个开关；主题开关打开即暖色外观（DeepSeek logo 不变）；
     伪装开关打开后 logo/词标/标题/favicon 全部变为 Claude，关闭即还原；
   - 两个开关都即时生效，无需重启或刷新。

注意：更新 client bundle 内容时，file: 依赖需要 remove + add 重同步
（pnpm 按 package.json 版本判断是否重装）：
`dsh plugin --profile web remove dsh-claude-theme && dsh plugin --profile web add file:<本仓库路径>/claude-theme`，
然后硬刷新一次页面加载新 bundle。

回滚：`dsh plugin --profile web remove dsh-claude-theme` 后重启。
````

## 项目结构

```
claude-theme/
├── package.json      # 包声明：dsh.bundle.patch（自动挂载）+ dsh.client 契约 + exports
├── cordis.patch.yml  # bundle patch：插入 claude-theme 插件行
├── README.md         # 本文件
└── lib/
    ├── index.js      # Node 半区：注册 claude-theme 设置命名空间（{ enabled }）
    └── client.js     # 浏览器半区（ModuleLoader bundle）：主题 + 伪装 + 设置 tab
```

## 安装 / 挂载（官方 CLI）

```sh
# 本地包
dsh plugin --profile web add file:<本仓库路径>/claude-theme

# 发布到 npm 后（与 dsh-better-sidebar 相同的安装方式）
dsh plugin --profile web add dsh-claude-theme@<版本>
```

包内 `dsh.bundle.patch` 声明（`./cordis.patch.yml`）让 CLI 的 bundle 协调自动把
`dsh-claude-theme` 追加进 profile 的 `dsh.profile.bundles`——**无需手动编辑
composition**。重启 `dsh web` 后生效。

回滚：`dsh plugin --profile web remove dsh-claude-theme` 后重启。

## 实现机制

### Node 半区（lib/index.js）

`settings.register('claude-theme', z.object({ enabled: z.boolean().default(true) }))`
—— 命名空间 schema 注册，首次安装默认启用。

### 浏览器半区（lib/client.js）

- **主题**：
  1. `theme.overrideTokens()` 覆盖 13 个核心令牌（body 内联样式，随明暗自动切换）；
  2. 包级 `<style>` 标签（`data-plugin="dsh-claude-theme"`）替换派生变量——
     基础样式表里约 60 个 alias 变量直接引用蓝灰静态色板，这里整体换成
     Claude 暖色板（浅色 `body` / 深色 `body[data-ds-dark-theme]`）。
- **设置 tab**：注册 `settings.section`（id: `claude-theme`），
  渲染两个赤陶色 switch 行。
- **伪装引擎**（React 安全策略）：
  - 词标 SVG（`clipPath#dsh-wordmark-*`）仅隐藏（inline display:none），
    在容器上叠加绝对定位的 Claude 星芒 + 衬线 "Claude" 字标——不动 React
    管理的子节点，避免 reconciler 崩溃；
  - 文本节点只改 `nodeValue`（"DeepSeek"→"Claude"，跳过 script/style/code/pre
    等用户内容子树）；仅替换 title/aria-label/alt/placeholder 属性；
  - `document.title` 与 favicon（data URI 星芒）替换并记录原件；
  - MutationObserver + rAF 防抖重扫：React 重渲染 / 路由切换后自动重新覆盖；
  - 关闭时从 WeakMap 记录还原全部原件、移除叠加层、断开 observer——完全可逆；
  - 伪装状态存 localStorage（host schema 变更需重启，故不挂 host 设置）。
- 所有副作用注册 `ctx.effect`，插件卸载时自动清理。

## 核心令牌映射（theme.overrideTokens，浅色 / 深色）

| 令牌 | 浅色 | 深色 |
| --- | --- | --- |
| `--dsw-alias-bg-base` | `#faf9f5` 象牙白 | `#262624` |
| `--dsw-alias-bg-layer-1` | `#ffffff` | `#30302e` |
| `--dsw-alias-bg-layer-2` | `#f7f5f0` | `#383836` |
| `--dsw-alias-bg-overlay` | `#ffffff` | `#2e2e2c` |
| `--dsw-alias-border-l1` | `rgba(31,30,29,.08)` | `rgba(255,255,255,.08)` |
| `--dsw-alias-border-l2` | `rgba(31,30,29,.14)` | `rgba(255,255,255,.14)` |
| `--dsw-alias-brand-primary` | `#d97757` 赤陶 | `#e08568` |
| `--dsw-alias-label-primary` | `#1f1e1d` | `#f5f4ee` |
| `--dsw-alias-label-secondary` | `#6e6a5e` | `#b8b4aa` |
| `--dsw-alias-state-error-primary` | `#c0392b` | `#e0665a` |
| `--dsw-alias-state-success-primary` | `#3d8f6d` | `#4fa382` |
| `--dsw-alias-state-warn-primary` | `#a66e1b` | `#d9a13c` |
| `--dsw-specific-sidebar-fill` | `#f3f1ea` | `#232321` |

派生面覆盖按钮 hover、代码块、tooltip、toast、滚动条、tertiary 文字、
thinking 渐变等全部暖色化；`::selection` 赤陶高光。

## 设计参考（Claude.ai 色板）

- 背景 ivory `#FAF9F5`、暗色 `#262624`；表面 `#FFFFFF` / `#30302E`
- 主色 terracotta `#D97757`（hover `#C4633F`）；暗色下 `#E08568`
- 主文字 `#1F1E1D` / `#F5F4EE`；次要 `#6E6A5E` / `#B8B4AA`
- 边框 hairline 暖灰；代码块 `#F5F3EC` / `#30302D`；tooltip/toast 深暖 `#262624`

## 备注

- 圆角体系已是 12px（与 Claude 接近），未改动。
- 字体沿用系统无衬线栈（Claude 字标用衬线，正文不动）。
- 伪装不修改用户内容（代码块、聊天文本中的 "DeepSeek" 字面量保持不变）。
