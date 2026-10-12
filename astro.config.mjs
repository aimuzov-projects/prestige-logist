import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

export default defineConfig({
	// Абсолютные ссылки в canonical, og:url и sitemap.
	site: 'https://logist.aimuzov.online',
	// CSS немного: внутри HTML он не блокирует первую отрисовку отдельным запросом.
	build: { inlineStylesheets: 'always' },
	// Svelte для интерактивных островков, остальное -- статичный HTML с ванильными скриптами.
	integrations: [svelte(), sitemap()],
	// Подсветка Shiki несовместима с CSP.
	markdown: { syntaxHighlight: false },
	// Astro кладёт CSP с хешами своих скриптов и стилей в <meta> страницы. Внешних источников
	// нет. frame-ancestors в <meta> не действует, встраивание запрещает X-Frame-Options в Caddy.
	security: {
		csp: {
			scriptDirective: { resources: ["'self'"] },
			directives: [
				"default-src 'self'",
				"img-src 'self' data:",
				"connect-src 'self'",
				'frame-src blob:',
				'child-src blob:',
				"object-src 'none'",
				"base-uri 'self'",
				"form-action 'self'",
			],
		},
	},
})
