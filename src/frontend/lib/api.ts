/** Запрос к своему API. Ошибку сервер присылает текстом в `error`, её и показываем. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, init)
	const result = await response.json().catch(() => ({}))

	if (!response.ok) throw new Error(result.error ?? `Сервер ответил ${response.status}`)

	return result as T
}

/** Отложенный запуск, который отменяется вместе с запросом: набор не шлёт запрос на каждую букву. */
export function later(ms: number, signal: AbortSignal, run: () => void) {
	const timer = setTimeout(run, ms)

	signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
}
