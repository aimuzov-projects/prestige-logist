import { siteChecks } from '@aimuzov/infra-site-kit/playwright/checks'

// Общие проверки сайтов: страницы из sitemap, axe, кнопка темы с подсмотром другой схемы
// и 404.
// Метрики на сайте нет.
siteChecks({
	theme: { button: (page) => page.getByRole('button', { name: /^Тема:/ }) },
	notFound: true,
})
