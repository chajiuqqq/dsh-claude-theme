# dsh-claude-theme — Claude 风格主题插件（DSH Web UI）

把 DSH Web 界面改为 **Claude 风格暖色主题**：象牙白背景、赤陶色（terracotta）主色、
暖灰文字，**保留 DeepSeek logo 与品牌元素**。浅色 / 深色两套色板。

这是一个**静态 client 插件包**：以 composition 行挂载，随 `dsh web` 启动加载，
并可在 **设置 → 常规** 中即时启用/禁用（状态持久化，重启保留）。

## 项目结构

```
claude-theme/
├── package.json      # 包声明：dsh.client 契约 + exports
├── README.md         # 本文件
└── lib/
    ├── index.js      # Node 半区：注册 claude-theme 设置命名空间（{ enabled }）
    └── client.js     # 浏览器半区（ModuleLoader bundle）：主题应用 + 设置开关行
```

## 安装 / 挂载

1. 把包放入 profile 可解析的 node_modules：
   `ln -s <repo>/claude-theme <profile>/node_modules/dsh-claude-theme`
2. 在 profile 的 `cordis.patch.yml` 追加：

   ```yaml
   - insert:
       - id: claude-theme
         name: 'dsh-claude-theme'
   ```

3. 重启 `dsh web`。设置 → 常规 → "Claude 风格主题" 开关，关闭即还原默认主题。

## 实现机制

### Node 半区（lib/index.js）

`settings.register('claude-theme', z.object({ enabled: z.boolean().default(true) }))`
—— 命名空间 schema 注册，首次安装默认启用。

### 浏览器半区（lib/client.js）

- **启动/切换**：`settingsScope.bind({ namespace: 'claude-theme' })` 读取快照，
  订阅变化；`enabled !== false` 时应用主题，否则移除。
- **主题两层**：
  1. `theme.overrideTokens()` 覆盖 13 个核心令牌（body 内联样式，随明暗自动切换）；
  2. 包级 `<style>` 标签（`data-plugin="dsh-claude-theme"`）替换派生变量——
     基础样式表里约 60 个 alias 变量直接引用蓝灰静态色板，这里整体换成
     Claude 暖色板（浅色 `body` / 深色 `body[data-ds-dark-theme]`）。
- **设置开关行**：注册 `settings.general.item`（id: `claude-theme`），
  赤陶色 switch 写入 `scope.set('enabled', value)`，即时生效。
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

派生面（styles.insert 内）覆盖按钮 hover、代码块、tooltip、toast、滚动条、
tertiary 文字、thinking 渐变等全部暖色化；`::selection` 赤陶高光。

## 设计参考（Claude.ai 色板）

- 背景 ivory `#FAF9F5`、暗色 `#262624`；表面 `#FFFFFF` / `#30302E`
- 主色 terracotta `#D97757`（hover `#C4633F`）；暗色下 `#E08568`
- 主文字 `#1F1E1D` / `#F5F4EE`；次要 `#6E6A5E` / `#B8B4AA`
- 边框 hairline 暖灰；代码块 `#F5F3EC` / `#30302D`；tooltip/toast 深暖 `#262624`

## 备注

- 圆角体系已是 12px（与 Claude 接近），未改动。
- 字体沿用系统无衬线栈（与 Claude 正文一致），未改动。
- 未触碰任何 Slots / logo 组件，品牌元素保持 DeepSeek 原样。
