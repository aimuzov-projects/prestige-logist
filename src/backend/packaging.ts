/**
 * Справочник видов тары (ОКВГУМТип) из открытого списка Контура.
 *
 * Коды те же, что ждёт атрибут ВидТар: 8A — поддон деревянный, как в эталоне
 * ЭЗЗ 5661. Список статичный, поэтому тянем его один раз на процесс.
 */

import type { PackagingKind } from '#shared/api.ts'

const PICKLIST = 'https://api.kontur.ru/picklist/v2/10448/?filter=&take=400'

let cache: Promise<PackagingKind[]> | undefined

async function load(): Promise<PackagingKind[]> {
	const response = await fetch(PICKLIST)

	if (!response.ok) throw new Error(`Справочник тары ответил ${response.status}`)

	const { data = [] } = (await response.json()) as { data?: PackagingKind[] }

	return data.map(({ code, name }) => ({ code, name }))
}

/** Неудачу не кэшируем: следующий запрос попробует снова. */
export function packagingKinds(): Promise<PackagingKind[]> {
	cache ??= load().catch((error) => {
		cache = undefined

		throw error
	})

	return cache
}

/** Ищем и по коду, и по названию: оператор помнит либо «8A», либо «поддон». */
export async function searchPackaging(query: string, limit = 20): Promise<PackagingKind[]> {
	const kinds = await packagingKinds()
	const needle = query.trim().toLowerCase()

	if (!needle) return kinds.slice(0, limit)

	return kinds
		.filter(({ code, name }) => code.toLowerCase().includes(needle) || name.toLowerCase().includes(needle))
		.slice(0, limit)
}
