/**
 * Реквизиты по ИНН из ЕГРЮЛ/ЕГРИП — и свои, и перевозчика.
 *
 * Кэш на процесс: форма пересобирает заявку на каждый введённый символ, и без
 * него один и тот же ИНН улетал бы в dadata десятки раз подряд.
 */

import type { ForwarderDetails } from '#backend/core/prefill.ts'
import { findParty, looksLikeInn, toCarrier, toForwarderDetails } from '#backend/dadata.ts'
import type { Carrier } from '#shared/request.ts'

/**
 * Токен dadata из окружения.
 *
 * Без него поиск адреса отвечает ошибкой, а реквизиты по ИНН просто не подтягиваются.
 */
export const dadataToken = process.env.DADATA_TOKEN

const cache = new Map<string, unknown>()

/** Недоступная dadata не должна ронять сборку: неудачу помним как «не нашлось». */
async function party(inn?: string) {
	if (!inn || !looksLikeInn(inn) || !dadataToken) return undefined

	if (!cache.has(inn)) {
		try {
			cache.set(inn, await findParty(inn, { token: dadataToken }))
		} catch {
			cache.set(inn, undefined)
		}
	}

	return cache.get(inn)
}

/**
 * Реквизиты перевозчика по ИНН, который ввёл оператор.
 *
 * ИНН в ответе берём из запроса, а не из dadata.
 * Не нашлось или dadata недоступна — `undefined`, оператор заполнит руками.
 */
export async function carrierByInn(inn?: string): Promise<Carrier | undefined> {
	const found = await party(inn)

	return found ? { ...toCarrier(found), inn } : undefined
}

/** Свои реквизиты по ИНН экспедитора из поручения, нужны для предзаполнения заявки. */
export async function forwarderByInn(inn?: string): Promise<ForwarderDetails | undefined> {
	const found = await party(inn)

	return found ? toForwarderDetails(found) : undefined
}
