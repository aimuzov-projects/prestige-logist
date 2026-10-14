import { siteChecks } from '@aimuzov-projects/infra-site-kit/playwright/checks'

// Общие проверки сайтов: страницы из sitemap, axe и кнопка темы с подсмотром другой схемы.
// Метрики на сайте нет.
siteChecks({
	theme: { button: (page) => page.getByRole('button', { name: /^Тема:/ }) },
})
