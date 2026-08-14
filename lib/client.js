/**
 * Claude 风格主题插件 — Client 半区（code.client 原样存档）
 *
 * 运行方式（当前动态插件 claude-1/pkg-1 即此源码）：
 *  - 该文件内容 = cordis_define 时传入的 code.client（函数体，非模块导出）。
 *  - 重新部署：用 cordis_define(plugin.kind: 'existing', pluginId: 'claude-1')
 *    传入本文件内容作为 code.client，再用 cordis_run(update) 激活。
 *
 * 机制说明：
 *  1) theme.overrideTokens() 覆盖 13 个核心令牌（body 内联样式，随明暗自动切换，
 *     卸载时自动还原）；
 *  2) styles.insert() 补充派生变量层——基础样式表里大量 alias 变量直接引用
 *     蓝灰色静态色板，这里整体替换为 Claude 暖色板（浅色 body / 深色
 *     body[data-ds-dark-theme]，同选择器后者生效）。
 *
 * 环境注记：
 *  - theme 服务为可选依赖，用 ctx.get('theme') 获取并判空；
 *  - styles / React 为 Client 半区闭包注入参数，直接引用；
 *  - 全部副作用（token 层 + style 标签）注册到 ctx.effect，插件停止/更新时自动清理。
 */
return {
  apply(ctx) {
    const theme = ctx.get('theme')
    if (theme === undefined) return

    // 1) 核心令牌层：theme 服务叠加层（写为 body 内联样式，自动跟随明暗切换）
    const disposeTheme = theme.overrideTokens('claude-style', {
      '--dsw-alias-bg-base': { light: '#faf9f5', dark: '#262624' },
      '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#30302e' },
      '--dsw-alias-bg-layer-2': { light: '#f7f5f0', dark: '#383836' },
      '--dsw-alias-bg-overlay': { light: '#ffffff', dark: '#2e2e2c' },
      '--dsw-alias-border-l1': { light: 'rgba(31,30,29,0.08)', dark: 'rgba(255,255,255,0.08)' },
      '--dsw-alias-border-l2': { light: 'rgba(31,30,29,0.14)', dark: 'rgba(255,255,255,0.14)' },
      '--dsw-alias-brand-primary': { light: '#d97757', dark: '#e08568' },
      '--dsw-alias-label-primary': { light: '#1f1e1d', dark: '#f5f4ee' },
      '--dsw-alias-label-secondary': { light: '#6e6a5e', dark: '#b8b4aa' },
      '--dsw-alias-state-error-primary': { light: '#c0392b', dark: '#e0665a' },
      '--dsw-alias-state-success-primary': { light: '#3d8f6d', dark: '#4fa382' },
      '--dsw-alias-state-warn-primary': { light: '#a66e1b', dark: '#d9a13c' },
      '--dsw-specific-sidebar-fill': { light: '#f3f1ea', dark: '#232321' },
    })

    // 2) 派生面：基础样式表里大量 alias 变量直接引用蓝灰色静态色，
    //    用包级样式表整体换成 Claude 暖色板（浅色 body / 深色 body[data-ds-dark-theme]）
    const disposeCss = styles.insert(`
body {
  --dsw-alias-bg-layer-3: #f1efe8;
  --dsw-alias-bg-module-platform: #f5f3ec;
  --dsw-alias-bg-multi-select: #f5f3ec;
  --dsw-alias-bg-skeleton: rgba(31,30,29,0.05);
  --dsw-alias-bg-mask-drop: rgba(255,255,255,0.7);
  --dsw-alias-brand-primary-invert: #b45a3d;
  --dsw-alias-brand-primary-new-colorprimary-new-color: #d97757;
  --dsw-alias-brand-text: #b45a3d;
  --dsw-alias-button-contrast-fill: #1f1e1d;
  --dsw-alias-button-elevated-fill: #ffffff;
  --dsw-alias-button-floating-fill: #ffffff;
  --dsw-alias-button-floating-hover: #f3f1ea;
  --dsw-alias-button-ghost-active-border: #cfcbc0;
  --dsw-alias-button-ghost-active-fill: #efede6;
  --dsw-alias-button-ghost-active-hover: #e7e4db;
  --dsw-alias-button-info-fill: #d97757;
  --dsw-alias-button-info-hover: #c4633f;
  --dsw-alias-button-primary-dimmed: #f3e5df;
  --dsw-alias-button-primary-hover: #c4633f;
  --dsw-alias-interactive-bg-active: rgba(31,30,29,0.09);
  --dsw-alias-interactive-bg-hover-accent: rgba(217,119,87,0.14);
  --dsw-alias-interactive-bg-hover-danger: rgba(192,57,43,0.06);
  --dsw-alias-interactive-bg-hover: rgba(31,30,29,0.05);
  --dsw-alias-interactive-bg-hover-solid: #efede6;
  --dsw-alias-label-caption: #8f8a80;
  --dsw-alias-label-dimmed: #c2beb4;
  --dsw-alias-label-primary-bluish: #1f1e1d;
  --dsw-alias-label-primary-dimmed: #1f1e1d;
  --dsw-alias-label-primary-foreground: #ffffff;
  --dsw-alias-label-primary-inverted: #ffffff;
  --dsw-alias-markdown-citation: #f0ede5;
  --dsw-alias-markdown-code-block-banner: #f5f3ec;
  --dsw-alias-markdown-code-block: #f5f3ec;
  --dsw-alias-markdown-code-segment-selected: #ffffff;
  --dsw-alias-markdown-code-segment-unselected: #f1efe8;
  --dsw-alias-markdown-inline-code: #f0ede5;
  --dsw-alias-markdown-placeholder: #f5f3ec;
  --dsw-alias-markdown-tag: #f1efe8;
  --dsw-alias-scrollbar-bg-l1: rgba(31,30,29,0.12);
  --dsw-alias-scrollbar-bg-l2: rgba(31,30,29,0.12);
  --dsw-alias-scrollbar-hover-l1: rgba(31,30,29,0.22);
  --dsw-alias-scrollbar-hover-l2: rgba(31,30,29,0.22);
  --dsw-alias-state-business-primary: #d97757;
  --dsw-alias-state-business-tertiary: #f6e8e1;
  --dsw-alias-state-error-secondary: #d64545;
  --dsw-alias-state-success-secondary: #3d8f6d;
  --dsw-alias-state-success-tertiary: #e3f2eb;
  --dsw-alias-state-warn-label: #9c6b0e;
  --dsw-alias-state-warn-secondary: #d9a13c;
  --dsw-alias-state-warn-tertiary: #fbf1dc;
  --dsw-alias-toast-bg: #262624;
  --dsw-alias-tooltip-bg: #262624;
  --dsw-linear-gradient-think: linear-gradient(180deg, #faf9f5 20.19%, rgba(250,249,245,0) 100%);
  --dsw-linear-think-select: linear-gradient(180deg, #f3f1ea 20.19%, rgba(243,241,234,0) 100%);
}
body[data-ds-dark-theme] {
  --dsw-alias-bg-layer-3: #3d3c3a;
  --dsw-alias-bg-module-platform: #2b2b29;
  --dsw-alias-bg-multi-select: #2b2b29;
  --dsw-alias-bg-skeleton: rgba(255,255,255,0.07);
  --dsw-alias-bg-mask-drop: rgba(27,27,25,0.7);
  --dsw-alias-brand-primary-invert: #e08568;
  --dsw-alias-brand-primary-new-colorprimary-new-color: #e08568;
  --dsw-alias-brand-text: #e08568;
  --dsw-alias-button-contrast-fill: #f5f4ee;
  --dsw-alias-button-elevated-fill: #343432;
  --dsw-alias-button-floating-fill: #30302e;
  --dsw-alias-button-floating-hover: #3a3a37;
  --dsw-alias-button-ghost-active-border: #575550;
  --dsw-alias-button-ghost-active-fill: #3a3a37;
  --dsw-alias-button-ghost-active-hover: #43423f;
  --dsw-alias-button-info-fill: #d97757;
  --dsw-alias-button-info-hover: #e08568;
  --dsw-alias-button-primary-dimmed: #57382d;
  --dsw-alias-button-primary-hover: #e79a7d;
  --dsw-alias-interactive-bg-active: rgba(255,255,255,0.12);
  --dsw-alias-interactive-bg-hover-accent: rgba(224,133,104,0.2);
  --dsw-alias-interactive-bg-hover-danger: rgba(224,102,90,0.15);
  --dsw-alias-interactive-bg-hover: rgba(255,255,255,0.07);
  --dsw-alias-interactive-bg-hover-solid: #3a3a37;
  --dsw-alias-label-caption: #99948a;
  --dsw-alias-label-dimmed: #6e6b63;
  --dsw-alias-label-primary-bluish: #f5f4ee;
  --dsw-alias-label-primary-dimmed: #f5f4ee;
  --dsw-alias-label-primary-foreground: #ffffff;
  --dsw-alias-label-primary-inverted: #262624;
  --dsw-alias-markdown-citation: #3a3935;
  --dsw-alias-markdown-code-block-banner: #33332f;
  --dsw-alias-markdown-code-block: #30302d;
  --dsw-alias-markdown-code-segment-selected: #3d3c3a;
  --dsw-alias-markdown-code-segment-unselected: #343430;
  --dsw-alias-markdown-inline-code: #3a3935;
  --dsw-alias-markdown-placeholder: #343430;
  --dsw-alias-markdown-tag: #3a3935;
  --dsw-alias-scrollbar-bg-l1: rgba(255,255,255,0.14);
  --dsw-alias-scrollbar-bg-l2: rgba(255,255,255,0.14);
  --dsw-alias-scrollbar-hover-l1: rgba(255,255,255,0.22);
  --dsw-alias-scrollbar-hover-l2: rgba(255,255,255,0.22);
  --dsw-alias-state-business-primary: #e08568;
  --dsw-alias-state-business-tertiary: #4a3228;
  --dsw-alias-state-error-secondary: #e88b80;
  --dsw-alias-state-success-secondary: #6cbb9c;
  --dsw-alias-state-success-tertiary: #24463a;
  --dsw-alias-state-warn-label: #e0a33c;
  --dsw-alias-state-warn-secondary: #d9a13c;
  --dsw-alias-state-warn-tertiary: #4a3a20;
  --dsw-alias-toast-bg: #3d3c3a;
  --dsw-alias-tooltip-bg: #3d3c3a;
  --dsw-linear-gradient-think: linear-gradient(180deg, #232321 20.19%, rgba(35,35,33,0) 100%);
  --dsw-linear-think-select: linear-gradient(180deg, #2c2c2a 20.19%, rgba(44,44,42,0) 100%);
}
::selection {
  background: rgba(217,119,87,0.25);
}
`)

    ctx.effect(() => () => {
      disposeTheme()
      disposeCss()
    })
  },
}
