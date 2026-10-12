import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

const proxy = { '/api': 'http://localhost:8787' }

export default defineConfig({
	// Рядом с сайтом в src/ лежат API и общий с ним код.
	srcDir: './src/frontend',
	// Абсолютные ссылки в canonical, og:url и sitemap.
	site: 'https://logist.aimuzov.online',
	// CSS немного: внутри HTML он не блокирует первую отрисовку отдельным запросом.
	build: { inlineStylesheets: 'always' },
	// Svelte для интерактивных островков, остальное -- статичный HTML с ванильными скриптами.
	integrations: [svelte(), sitemap()],
	// На проде /api отдаёт Caddy сервису API, локально его роль играет прокси Vite: и в dev, и в preview.
	vite: { server: { proxy }, preview: { proxy } },
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
