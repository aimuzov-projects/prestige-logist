// Выбранную тему ставим до отрисовки, иначе страница мигнёт системной. Пара — theme-toggle.svelte.
// Отдельный файл, а не инлайн: CSP разрешает только свои скрипты по адресу.
try {
	const theme = localStorage.getItem('theme')
	if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme
} catch {
	// Хранилище закрыто — остаётся тема системы.
}
