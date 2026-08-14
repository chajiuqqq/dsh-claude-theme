/**
 * dsh-claude-theme — 浏览器半区（client half）
 *
 * 静态 client 插件 bundle（ModuleLoader 格式）：
 *  - 启动时读取 `claude-theme` 设置命名空间；enabled=true 应用 Claude 风格主题；
 *  - 在 设置 → 常规 注册 "Claude 风格主题" 开关行（settings.general.item），
 *    切换写入命名空间字段，持久化并即时生效；
 *  - 主题两层机制：
 *      1) ctx.theme.overrideTokens() 覆盖 13 个核心令牌（body 内联样式，
 *         随明暗自动切换）；
 *      2) 包级 <style> 标签替换派生变量（基础样式表里大量 alias 变量直接引用
 *         蓝灰静态色板，这里整体换成 Claude 暖色板，浅色 body / 深色
 *         body[data-ds-dark-theme]）。
 *  - 全部副作用注册 ctx.effect，插件卸载时自动清理。
 */
window.__ModuleLoader__.load({
  id: "dsh-claude-theme",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");
    let runtime = require("@deepseek-ai/dsh-client-runtime");
    //#region tokens & css
    /** 13 个核心令牌：theme 服务叠加层（写为 body 内联样式，自动跟随明暗切换）。 */
    const TOKENS = {
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
    };
    /** 派生面样式表：把引用蓝灰静态色的 alias 变量整体换成 Claude 暖色板。 */
    const THEME_CSS = `
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
`;
    /** 设置开关行样式。 */
    const ROW_CSS = `
.ctThemeRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 2px}
.ctThemeCopy{min-width:0;display:flex;flex-direction:column;gap:3px}
.ctThemeTitle{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:1.5}
.ctThemeDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}
.ctThemeSwitch{appearance:none;border:0;cursor:pointer;flex:none;width:42px;height:24px;border-radius:999px;background:var(--dsw-alias-button-tool-bar-fill);padding:0;position:relative;transition:background .15s var(--ds-ease-in-out)}
.ctThemeKnob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:left .15s var(--ds-ease-in-out)}
.ctThemeSwitchOn{background:var(--dsw-alias-brand-primary)}
.ctThemeSwitchOn .ctThemeKnob{left:21px}
`;
    //#endregion
    //#region settings row
    /** 开关行 store：enabled 镜像自设置命名空间快照。 */
    function createRowStore() {
      return runtime.defineStore({
        init: () => ({ enabled: true, revision: -1 }),
        actions: { sync: (d, enabled, revision) => {
          if (revision <= d.revision) return;
          d.enabled = enabled;
          d.revision = revision;
        } }
      });
    }
    /** 设置行组件：标题 + 说明 + 赤陶色开关。 */
    function Row({ t, useStore, setEnabled }) {
      const enabled = useStore((s) => s.enabled);
      return react.createElement("div", { className: "ctThemeRow" },
        react.createElement("div", { className: "ctThemeCopy" },
          react.createElement("div", { className: "ctThemeTitle" }, t("claude.title")),
          react.createElement("div", { className: "ctThemeDesc" }, t("claude.desc"))),
        react.createElement("button", {
          type: "button",
          role: "switch",
          "aria-checked": enabled,
          className: "ctThemeSwitch" + (enabled ? " ctThemeSwitchOn" : ""),
          onClick: () => setEnabled(!enabled),
        }, react.createElement("span", { className: "ctThemeKnob" })));
    }
    //#endregion
    //#region locales
    /** 开关行文案（中文为键集基准）。 */
    const zh = {
      "claude.title": "Claude 风格主题",
      "claude.desc": "启用 Claude 风格暖色外观（保留 DeepSeek logo）"
    };
    const en = {
      "claude.title": "Claude-style theme",
      "claude.desc": "Use the Claude-style warm appearance (the DeepSeek logo stays)"
    };
    const LOCALE_NS = "settings.claude-theme";
    //#endregion
    /**
     * 客户端插件主体：读取设置、应用/移除主题、注册设置开关行。
     * @param ctx - client cordis context。
     */
    function apply(ctx) {
      const scope = ctx.settingsScope.bind({ namespace: "claude-theme" });
      const store = createRowStore();
      let bound = null;
      let disposeTokens = null;
      let themeTag = null;
      const removeTheme = () => {
        if (disposeTokens) { disposeTokens(); disposeTokens = null; }
        if (themeTag) { themeTag.remove(); themeTag = null; }
      };
      const applyTheme = () => {
        if (disposeTokens || themeTag) return;
        disposeTokens = ctx.theme.overrideTokens("claude-theme", TOKENS);
        themeTag = document.createElement("style");
        themeTag.dataset.plugin = "dsh-claude-theme";
        themeTag.textContent = THEME_CSS;
        document.head.append(themeTag);
      };
      /** 设置快照 → 应用或移除主题，并同步开关行。 */
      const sync = () => {
        const snapshot = scope.getSnapshot();
        const enabled = snapshot.value?.enabled !== false;
        if (enabled) applyTheme(); else removeTheme();
        if (bound) bound.sync(enabled, snapshot.revision ?? 0);
      };
      const off = scope.subscribe(sync);
      sync();
      ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), "claude-theme: row dictionaries");
      ctx.slots.inject("settings.general.item", () => ctx.slots.register({
        name: "settings.general.item",
        id: "claude-theme",
        order: 20,
        store,
        locale: LOCALE_NS,
        inject: (actions) => {
          bound = actions;
          sync();
          return { setEnabled: (value) => { scope.set("enabled", value); } };
        }
      }, Row));
      const rowTag = document.createElement("style");
      rowTag.dataset.plugin = "dsh-claude-theme";
      rowTag.textContent = ROW_CSS;
      document.head.append(rowTag);
      ctx.effect(() => () => {
        off();
        removeTheme();
        rowTag.remove();
      }, "claude-theme: teardown");
    }
    //#endregion
    /** 硬依赖服务：slots / locale / settingsScope / theme。 */
    const inject = ["slots", "locale", "settingsScope", "theme"];
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
