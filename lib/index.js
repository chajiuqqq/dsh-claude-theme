/**
 * dsh-claude-theme — Node 半区（host half）
 *
 * 注册 `claude-theme` 设置命名空间（schema: { enabled: boolean, default true }）。
 * 浏览器半区通过 settingsScope 读写该字段，实现设置页里的启用/禁用开关，
 * 状态持久化到 Host 设置存储，重启后保留。
 */
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

/** 设置命名空间：lowercase kebab-case。 */
const SETTINGS_NAMESPACE = settingsNamespace('claude-theme')

/** 命名空间 schema：enabled 缺省为 true（首次安装默认启用主题）。 */
const ClaudeThemeSettingsSchema = z.object({
  enabled: z.boolean().default(true),
})

export function apply(ctx) {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(SETTINGS_NAMESPACE, ClaudeThemeSettingsSchema)
  })
}
