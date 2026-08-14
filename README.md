# claude-theme — Claude 风格主题插件（DSH Web UI）

把 DSH Web 界面改为 **Claude 风格暖色主题**：象牙白背景、赤陶色（terracotta）主色、
暖灰文字，**保留 DeepSeek logo 与品牌元素**。浅色 / 深色两套色板。

## 项目结构

```
claude-theme/
├── package.json      # 项目元信息（含动态插件 ID 记录）
├── README.md         # 本文件
└── lib/
    └── client.js     # Client 半区插件源码（code.client 原样）
```

## 当前运行状态

| 项 | 值 |
| --- | --- |
| 插件 ID | `claude-1` |
| 包 ID | `pkg-1`（运行中，run-1） |
| 平台 | Client（浏览器） |
| 类型 | 动态 Cordis 插件（进程内，重启后失效） |

## 部署 / 重新激活

动态插件定义不落盘、重启后失效。重新激活步骤：

1. 在会话中让模型读取 `lib/client.js` 全文；
2. `cordis_define`（`plugin.kind: 'existing'`, `pluginId: 'claude-1'`，
   `code.client` = 文件内容）追加新 Package；
3. `cordis_run`（有 current 时用 `update` 模式）激活，页面批准后生效。

停用 / 还原：`cordis_stop`（临时停用）或 `cordis_undefine`（彻底删除），
界面立即还原为默认 DeepSeek 主题。

## 实现机制（两层）

### 1) 核心令牌层 — `theme.overrideTokens(source, tokens)`

Theme 服务把令牌写为 `document.body` 内联样式（`ThemePresenter`），随明暗切换自动
重放；卸载时自动还原。覆盖 13 个核心令牌：

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

### 2) 派生面 — `styles.insert(css)` 包级样式表

基础样式表里约 60 个 alias 变量直接引用**蓝灰静态色板**（如按钮 hover、代码块、
tooltip、滚动条、tertiary 文字等），theme 服务不覆盖它们。这里用包级 `<style>` 标签
按同一选择器（`body` / `body[data-ds-dark-theme]`）整体替换为暖色，后者级联生效；
插件卸载时标签自动移除。另含 `::selection` 赤陶高光与 thinking 渐变暖化。

## 设计参考（Claude.ai 色板）

- 背景 ivory `#FAF9F5`、暗色 `#262624`；表面 `#FFFFFF` / `#30302E`
- 主色 terracotta `#D97757`（hover `#C4633F`）；暗色下 `#E08568`
- 主文字 `#1F1E1D` / `#F5F4EE`；次要 `#6E6A5E` / `#B8B4AA`
- 边框 hairline 暖灰；代码块 `#F5F3EC` / `#30302D`；tooltip/toast 深暖 `#262624`

## 备注

- 圆角体系已是 12px（与 Claude 接近），未改动。
- 字体沿用系统无衬线栈（与 Claude 正文一致），未改动。
- 未触碰任何 Slots / logo 组件，品牌元素保持 DeepSeek 原样。
