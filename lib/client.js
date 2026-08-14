/**
 * dsh-claude-theme — 浏览器半区（client half）
 *
 * 静态 client 插件 bundle（ModuleLoader 格式）：
 *  - 设置 → "Claude 主题" tab（settings.section）内含两个开关：
 *    1) Claude 风格主题：暖色主题（象牙白 + 赤陶），走 host 设置命名空间
 *       claude-theme.{enabled}，持久化；
 *    2) Claude 伪装：运行时把 DeepSeek 品牌元素替换为 Claude（logo/词标、
 *       页面标题、favicon、品牌文本），存 localStorage，切换即时生效、
 *       免重启免刷新，全部可逆。
 *  - 主题两层机制：
 *      1) ctx.theme.overrideTokens() 覆盖 13 个核心令牌（body 内联样式，
 *         随明暗自动切换）；
 *      2) 包级 <style> 标签替换派生变量（浅色 body / 深色
 *         body[data-ds-dark-theme]）。
 *  - 伪装引擎（React 安全策略）：
 *      - 不改 React 管理的节点内容：词标 SVG 仅隐藏（inline display:none），
 *        在其容器上叠加绝对定位的 Claude 星芒 + 衬线 "Claude" 字标；
 *      - 文本节点只改 nodeValue（"DeepSeek"→"Claude"，跳过 code/pre 等
 *        用户内容子树），并用 WeakMap 记录原件以便还原；
 *      - 仅替换 title/aria-label/alt/placeholder 等属性；
 *      - document.title 与 favicon 替换并记录原件；
 *      - MutationObserver + rAF 防抖重扫，React 重渲染后自动重新覆盖；
 *      - 关闭时全部还原并断开 observer。
 *  - 全部副作用注册 ctx.effect，插件卸载时自动清理。
 */
window.__ModuleLoader__.load({
  id: "dsh-claude-theme",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");
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
    /** 设置 tab 与开关行样式 + 伪装字标样式。 */
    const ROW_CSS = `
.ctThemeSection{width:100%;max-width:760px;flex-direction:column;display:flex}
.ctThemeRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 2px}
.ctThemeRow+.ctThemeRow{border-top:1px solid var(--dsw-alias-border-l2)}
.ctThemeCopy{min-width:0;display:flex;flex-direction:column;gap:3px}
.ctThemeTitle{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:1.5}
.ctThemeDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}
.ctThemeSwitch{appearance:none;border:0;cursor:pointer;flex:none;width:42px;height:24px;border-radius:999px;background:var(--dsw-alias-button-tool-bar-fill);padding:0;position:relative;transition:background .15s var(--ds-ease-in-out)}
.ctThemeKnob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:left .15s var(--ds-ease-in-out)}
.ctThemeSwitchOn{background:var(--dsw-alias-brand-primary)}
.ctThemeSwitchOn .ctThemeKnob{left:21px}
.ctDisguiseWordmark{align-items:center;display:inline-flex;gap:.16em;color:var(--dsw-alias-label-primary);pointer-events:none;font-family:Georgia,"Times New Roman","Songti SC",serif;font-weight:600;letter-spacing:-.01em;line-height:1}
.ctDisguiseWordmark svg{height:1em;width:auto;display:block}
`;
    //#endregion
    //#region claude artwork
    /** 生成 Claude 星芒（12 条圆头光芒）的 SVG 片段。 */
    function claudeRays(cx, cy, inner, outer, width) {
      let s = "";
      const r = width / 2;
      for (let i = 0; i < 12; i++) {
        const a = i * 30;
        s += `<rect x="${(cx - width / 2).toFixed(2)}" y="${(cy - outer).toFixed(2)}" width="${width.toFixed(2)}" height="${(outer - inner).toFixed(2)}" rx="${r.toFixed(2)}" transform="rotate(${a} ${cx} ${cy})"/>`;
      }
      return s;
    }
    /** 内联 Claude 星芒图标（currentColor）。 */
    function claudeIconMarkup() {
      return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${claudeRays(12, 12, 5, 11, 2.6)}</svg>`;
    }
    /** 伪装 favicon（赤陶色星芒，data URI）。 */
    const CLAUDE_FAVICON = "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><rect width="50" height="50" rx="12" fill="#faf9f5"/><g fill="#d97757">${claudeRays(25, 25, 10.5, 23, 5.4)}</g></svg>`
    );
    //#endregion
    //#region disguise engine
    /** 伪装开关持久化键（localStorage：免重启免刷新的前提——host schema 变更需重启）。 */
    const DISGUISE_KEY = "dsh-claude-theme.disguise";
    const DISGUISE_ATTR = "data-ct-disguise";
    const disguise = {
      on: false,
      observer: null,
      scanScheduled: false,
      texts: new Set(),
      textOriginal: new WeakMap(),
      attrs: new Set(),
      attrOriginal: new WeakMap(),
      links: new Set(),
      linkOriginal: new WeakMap(),
      svgs: new Set(),
      svgDisplay: new WeakMap(),
      svgOverlay: new WeakMap(),
      titleOriginal: null,
      listeners: new Set(),
    };
    const disguiseStore = {
      getSnapshot: () => disguise.on,
      subscribe(listener) {
        disguise.listeners.add(listener);
        return () => {
          disguise.listeners.delete(listener);
        };
      },
    };
    function disguisePublish() {
      for (const listener of disguise.listeners) listener();
    }
    /** 目标节点是否在我们自己注入的元素内部。 */
    function isOurs(node) {
      return node instanceof Element ? node.closest(`[${DISGUISE_ATTR}]`) !== null : false;
    }
    /** 替换单个文本节点里的 DeepSeek → Claude，并记录原件。 */
    function disguiseText(node) {
      if (node.nodeType !== 3) return;
      if (!/DeepSeek/.test(node.nodeValue)) return;
      const parent = node.parentElement;
      if (parent !== null && parent.closest("script,style,code,pre") !== null) return;
      if (isOurs(parent)) return;
      if (!disguise.texts.has(node)) disguise.textOriginal.set(node, node.nodeValue);
      disguise.texts.add(node);
      node.nodeValue = node.nodeValue.replace(/DeepSeek/g, "Claude");
    }
    /** 替换元素上的品牌属性（title/aria-label/alt/placeholder）。 */
    function disguiseAttrs(el) {
      if (isOurs(el)) return;
      for (const attr of ["title", "aria-label", "alt", "placeholder"]) {
        const value = el.getAttribute && el.getAttribute(attr);
        if (typeof value !== "string" || !/DeepSeek/.test(value)) continue;
        if (!disguise.attrs.has(el)) {
          let map = disguise.attrOriginal.get(el);
          if (map === void 0) disguise.attrOriginal.set(el, (map = new Map()));
          map.set(attr, value);
          disguise.attrs.add(el);
        }
        el.setAttribute(attr, value.replace(/DeepSeek/g, "Claude"));
      }
    }
    /** 词标 SVG（whale clip）→ 隐藏并原位流式替换为 Claude 星芒 + 衬线字标。
     *  不用绝对定位叠加：词标容器多为内容驱动的 flex 盒子，SVG 隐藏后
     *  容器宽度会塌缩为 0，绝对定位层会被裁剪；流内替换让容器按字标
     *  尺寸自然撑开。 */
    function disguiseWordmark(svg) {
      const parent = svg.parentElement;
      if (parent === null) return;
      if (disguise.svgOverlay.has(svg)) {
        // React 重渲染可能清掉 inline style，重扫时重新断言
        svg.style.display = "none";
        return;
      }
      const box = svg.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) return;
      if (!disguise.svgs.has(svg)) disguise.svgDisplay.set(svg, svg.style.display);
      disguise.svgs.add(svg);
      svg.style.display = "none";
      const overlay = document.createElement("span");
      overlay.setAttribute(DISGUISE_ATTR, "1");
      overlay.className = "ctDisguiseWordmark";
      overlay.style.cssText =
        `display:inline-flex;vertical-align:middle;height:${Math.round(box.height)}px;` +
        `font-size:${Math.round(box.height * 0.82)}px;`;
      overlay.innerHTML = `${claudeIconMarkup()}<span>Claude</span>`;
      parent.appendChild(overlay);
      disguise.svgOverlay.set(svg, overlay);
    }
    /** 页面标题：DeepSeek → Claude，记录原件。 */
    function disguiseTitle() {
      if (disguise.titleOriginal === null) disguise.titleOriginal = document.title;
      if (/DeepSeek/.test(document.title)) document.title = document.title.replace(/DeepSeek/g, "Claude");
    }
    /** favicon 换成 Claude 星芒，记录原件。 */
    function disguiseFavicons() {
      for (const link of document.querySelectorAll('link[rel~="icon"]')) {
        if (disguise.linkOriginal.has(link)) continue;
        disguise.links.add(link);
        disguise.linkOriginal.set(link, link.getAttribute("href"));
        link.setAttribute("href", CLAUDE_FAVICON);
      }
    }
    /** 全量扫描一次。 */
    function scanAll() {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode()) !== null) disguiseText(node);
      const attrsWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let el;
      while ((el = attrsWalker.nextNode()) !== null) disguiseAttrs(el);
      for (const clip of document.querySelectorAll('clipPath[id^="dsh-wordmark"]')) {
        const svg = clip.closest("svg");
        if (svg !== null) disguiseWordmark(svg);
      }
      disguiseTitle();
      disguiseFavicons();
    }
    /** rAF 防抖重扫：React 重渲染 / 路由切换后自动重新覆盖。 */
    function scheduleScan() {
      if (!disguise.on || disguise.scanScheduled) return;
      disguise.scanScheduled = true;
      requestAnimationFrame(() => {
        disguise.scanScheduled = false;
        if (!disguise.on) return;
        scanAll();
      });
    }
    /** 打开伪装：立即扫描 + 常驻 MutationObserver。 */
    function startDisguise() {
      if (disguise.on) return;
      disguise.on = true;
      scanAll();
      disguise.observer = new MutationObserver((records) => {
        if (!disguise.on) return;
        const onlyOurs = records.every((r) => {
          const target = r.target instanceof Element ? r.target : r.target.parentElement;
          return target !== null && isOurs(target);
        });
        if (onlyOurs) return;
        scheduleScan();
      });
      disguise.observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
      disguisePublish();
    }
    /** 关闭伪装：还原全部原件、移除叠加层、断开 observer。 */
    function stopDisguise() {
      if (!disguise.on) return;
      disguise.on = false;
      if (disguise.observer !== null) {
        disguise.observer.disconnect();
        disguise.observer = null;
      }
      for (const node of disguise.texts) {
        const original = disguise.textOriginal.get(node);
        if (original !== void 0) node.nodeValue = original;
      }
      disguise.texts.clear();
      for (const el of disguise.attrs) {
        const map = disguise.attrOriginal.get(el);
        if (map !== void 0) for (const [attr, original] of map) el.setAttribute(attr, original);
      }
      disguise.attrs.clear();
      for (const link of disguise.links) {
        const original = disguise.linkOriginal.get(link);
        if (original !== null) link.setAttribute("href", original);
      }
      disguise.links.clear();
      for (const svg of disguise.svgs) {
        svg.style.display = disguise.svgDisplay.get(svg) ?? "";
        const overlay = disguise.svgOverlay.get(svg);
        if (overlay !== void 0) overlay.remove();
      }
      disguise.svgs.clear();
      if (disguise.titleOriginal !== null && document.title !== disguise.titleOriginal) {
        document.title = disguise.titleOriginal;
      }
      disguise.titleOriginal = null;
      disguisePublish();
    }
    /** 开关写入：持久化 + 即时应用/还原。 */
    function setDisguise(value) {
      try {
        localStorage.setItem(DISGUISE_KEY, value ? "1" : "0");
      } catch (_) {
        /* localStorage 不可用时仅本次会话生效 */
      }
      if (value) startDisguise();
      else stopDisguise();
    }
    //#endregion
    //#region locales
    /** 设置 tab 与开关行文案（中文为键集基准）。 */
    const zh = {
      "claude.nav": "Claude 主题",
      "claude.title": "Claude 风格主题",
      "claude.desc": "启用 Claude 风格暖色外观（象牙白背景、赤陶色主色）",
      "claude.disguiseTitle": "Claude 伪装",
      "claude.disguiseDesc": "把界面中的 DeepSeek 元素替换为 Claude（logo、页面标题、favicon、品牌文本），即时生效、可随时还原",
    };
    const en = {
      "claude.nav": "Claude Theme",
      "claude.title": "Claude-style theme",
      "claude.desc": "Use the Claude-style warm appearance (ivory background, terracotta accent)",
      "claude.disguiseTitle": "Claude disguise",
      "claude.disguiseDesc": "Replace DeepSeek branding with Claude (logo, page title, favicon, brand text) instantly; fully reversible",
    };
    const LOCALE_NS = "settings.claude-theme";
    //#endregion
    /**
     * 客户端插件主体：主题应用/移除 + 伪装引擎 + 设置 tab。
     * @param ctx - client cordis context。
     */
    function apply(ctx) {
      const scope = ctx.settingsScope.bind({ namespace: "claude-theme" });
      const t = ctx.locale.bind(LOCALE_NS);
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
      /** 设置快照 → 应用或移除主题。 */
      const sync = () => {
        const snapshot = scope.getSnapshot();
        const enabled = snapshot.value?.enabled !== false;
        if (enabled) applyTheme(); else removeTheme();
      };
      const off = scope.subscribe(sync);
      sync();
      // 伪装初始状态（localStorage，免重启）
      let disguiseInitial = false;
      try {
        disguiseInitial = localStorage.getItem(DISGUISE_KEY) === "1";
      } catch (_) {
        /* ignore */
      }
      if (disguiseInitial) startDisguise();
      ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), "claude-theme: tab dictionaries");
      /** 开关行组件。 */
      function SwitchRow(props) {
        return react.createElement("div", { className: "ctThemeRow" },
          react.createElement("div", { className: "ctThemeCopy" },
            react.createElement("div", { className: "ctThemeTitle" }, props.title),
            react.createElement("div", { className: "ctThemeDesc" }, props.desc)),
          react.createElement("button", {
            type: "button",
            role: "switch",
            "aria-checked": props.checked,
            className: "ctThemeSwitch" + (props.checked ? " ctThemeSwitchOn" : ""),
            onClick: () => props.onChange(!props.checked),
          }, react.createElement("span", { className: "ctThemeKnob" })));
      }
      /** 设置 tab 内容：主题开关 + 伪装开关。 */
      // 注意：不能把 scope.subscribe / scope.getSnapshot 脱绑定传给
      // useSyncExternalStore（类方法内部用 this），必须用箭头包装。
      const subscribeScope = (listener) => scope.subscribe(listener);
      const getScopeSnapshot = () => scope.getSnapshot();
      function ClaudeThemeSection() {
        const snapshot = react.useSyncExternalStore(subscribeScope, getScopeSnapshot);
        const themeOn = snapshot.value?.enabled !== false;
        const disguiseOn = react.useSyncExternalStore(disguiseStore.subscribe, disguiseStore.getSnapshot);
        return react.createElement("div", { className: "ctThemeSection" },
          react.createElement(SwitchRow, {
            title: t("claude.title"),
            desc: t("claude.desc"),
            checked: themeOn,
            onChange: (value) => { scope.set("enabled", value); },
          }),
          react.createElement(SwitchRow, {
            title: t("claude.disguiseTitle"),
            desc: t("claude.disguiseDesc"),
            checked: disguiseOn,
            onChange: (value) => { setDisguise(value); },
          }));
      }
      ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "claude-theme",
        order: 30,
        label: () => t("claude.nav"),
        locale: LOCALE_NS,
      }, ClaudeThemeSection));
      const rowTag = document.createElement("style");
      rowTag.dataset.plugin = "dsh-claude-theme";
      rowTag.textContent = ROW_CSS;
      document.head.append(rowTag);
      ctx.effect(() => () => {
        off();
        removeTheme();
        stopDisguise();
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
