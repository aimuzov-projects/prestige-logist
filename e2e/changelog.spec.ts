import { expect, test } from '@playwright/test'

test('значки в углу ведут на «О сервисе» и «Что нового», свой горит и никуда не ведёт', async ({ page }) => {
	await page.goto('/about')
	await page.getByRole('link', { name: 'Что нового' }).click()

	await expect(page).toHaveURL(/\/changelog\/?$/)
	await expect(page.getByRole('heading', { level: 1, name: 'Что нового' })).toBeVisible()

	const own = page.getByRole('link', { name: 'Что нового' })

	await expect(own).toHaveAttribute('aria-current', 'page')
	await expect(own).not.toHaveAttribute('href')

	// Первая ссылка -- значок в шапке: «О сервисе» есть ещё в записи 1.0.0
	await page.getByRole('link', { name: 'О сервисе' }).first().click()
	await expect(page).toHaveURL(/\/about\/?$/)
})

test('в мастере логотип -- просто знак, о сервисе рассказывает значок в углу', async ({ page }) => {
	await page.goto('/')

	await expect(page.getByRole('img', { name: 'Логист' })).toBeVisible()
	await expect(page.locator('a', { has: page.getByRole('img', { name: 'Логист' }) })).toHaveCount(0)
	await expect(page.getByRole('link', { name: 'О сервисе' })).toHaveAttribute('href', '/about')
})

test('подсказка значка показывает подпись и закрывается по Esc', async ({ page }) => {
	await page.goto('/about')

	const link = page.getByRole('link', { name: 'Что нового' })
	const tip = link.locator('xpath=following-sibling::*[1]')

	await link.focus()
	await expect(tip).toBeVisible()
	await expect(tip).toHaveText('Что нового')
	await page.keyboard.press('Escape')
	await expect(tip).toBeHidden()
})

test('каждый релиз -- раздел с датой и версией, оглавление ведёт к нему', async ({ page }) => {
	await page.goto('/changelog')

	await expect(page.locator('#v1-0-0')).toContainText('версия 1.0.0')
	await page.getByRole('navigation', { name: 'Релизы' }).getByRole('link').last().click()
	await expect(page).toHaveURL(/#v1-0-0$/)
})
