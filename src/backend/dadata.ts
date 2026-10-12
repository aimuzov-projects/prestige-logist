/**
 * Поиск адреса по ФИАС и реквизитов по ИНН через dadata.
 *
 * Нужен, чтобы не набивать руками полтора десятка полей ФИАС — особенно на
 * поручениях из 1С, где адрес приходит одной строкой. Проверено: fias_id, который
 * dadata отдаёт по тексту адреса из поручения, совпадает с ИдНом в заявке ЭЗЗ 5667.
 */

import type { FiasAddress } from '#/core/address/schema.ts'
import type { ForwarderDetails } from '#/core/prefill.ts'
import type { Carrier } from '#/core/request/build.ts'

const SUGGEST_ADDRESS = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
const FIND_PARTY = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party'

type DadataAddress = Record<string, string | null | undefined>

/** Сокращения через дефис и номера зданий Диадок пишет без точки, остальное — с точкой. */
const withDot = (type?: string | null) => (!type || type.includes('-') ? (type ?? undefined) : `${type}.`)

/**
 * ВидКод муниципального образования dadata не отдаёт, угадываем по составу адреса:
 * район без города — муниципальный район, город без района — городской округ.
 * Оператор видит поле в форме и поправит, если ГАР считает иначе.
 */
function municipality({ area, city }: DadataAddress) {
	if (area) return { kindCode: city ? '4' : '1', name: area }
	return city ? { kindCode: '2', name: city } : undefined
}

function locality({ area, city, city_type, settlement, settlement_type }: DadataAddress) {
	if (settlement) return { kind: withDot(settlement_type), name: settlement }
	return area && city ? { kind: withDot(city_type), name: city } : undefined
}

const dropEmpty = <T extends object>(value: T): T =>
	Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T

/** Ответ dadata в наш плоский адрес — тот же формат, что у полей формы. */
export function toAddress(data: DadataAddress): FiasAddress {
	return dropEmpty({
		fiasId: data.fias_id ?? undefined,
		postalCode: data.postal_code ?? undefined,
		region: data.region_kladr_id?.slice(0, 2),
		municipalDistrict: municipality(data),
		locality: locality(data),
		street: data.street ? { type: withDot(data.street_type), name: data.street } : undefined,
		buildings: [
			data.house && { type: data.house_type ?? undefined, number: data.house },
			data.block && { type: data.block_type ?? undefined, number: data.block },
		].filter(Boolean) as FiasAddress['buildings'],
		premises: data.flat ? [{ type: data.flat_type ?? undefined, number: data.flat }] : undefined,
	})
}

export type AddressSuggestion = {
	label: string
	address: FiasAddress
}

/** Ответ dadata по организации — только те поля, которые нам действительно нужны. */
export type DadataParty = {
	type?: 'LEGAL' | 'INDIVIDUAL'
	inn?: string
	kpp?: string | null
	ogrn?: string | null
	name?: { full_with_opf?: string }
	fio?: { surname?: string; name?: string; patronymic?: string | null }
	address?: { data?: DadataAddress }
}

async function ask<T>(url: string, token: string, body: object) {
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Authorization: `Token ${token}`,
		},
		body: JSON.stringify(body),
	})
	if (!response.ok) throw new Error(`dadata ответила ${response.status}`)
	return (await response.json()) as { suggestions?: Array<{ value: string; data: T }> }
}

export async function searchAddresses(
	query: string,
	{ token, count = 7 }: { token?: string; count?: number },
): Promise<AddressSuggestion[]> {
	if (!token) throw new Error('Не задан DADATA_TOKEN — поиск адреса по ФИАС недоступен.')
	if (!query?.trim()) return []

	const { suggestions = [] } = await ask<DadataAddress>(SUGGEST_ADDRESS, token, { query, count })
	return suggestions.map(({ value, data }) => ({ label: value, address: toAddress(data) }))
}

/** ИНН юрлица — 10 цифр, ИП — 12. Частичный ввод в dadata не гоняем. */
export const looksLikeInn = (inn?: string) => /^(\d{10}|\d{12})$/.test(String(inn ?? '').trim())

/** Реквизиты перевозчика из ЕГРЮЛ. Адрес тут юридический, оператор его правит. */
export function toCarrier(data: DadataParty): Carrier {
	const isSoleTrader = data.type === 'INDIVIDUAL'
	const name = data.fio ?? {}

	return dropEmpty({
		kind: isSoleTrader ? 'ИП' : 'ЮЛ',
		inn: data.inn,
		name: isSoleTrader ? undefined : data.name?.full_with_opf,
		kpp: isSoleTrader ? undefined : (data.kpp ?? undefined),
		ogrn: isSoleTrader ? undefined : (data.ogrn ?? undefined),
		ogrnip: isSoleTrader ? (data.ogrn ?? undefined) : undefined,
		lastName: isSoleTrader ? name.surname : undefined,
		firstName: isSoleTrader ? name.name : undefined,
		middleName: isSoleTrader ? (name.patronymic ?? undefined) : undefined,
		address: data.address?.data ? toAddress(data.address.data) : undefined,
	} as Carrier)
}

/** Свои реквизиты: заявке нужно полное наименование, а поручение везёт краткое. */
export function toForwarderDetails(data: DadataParty): ForwarderDetails {
	return dropEmpty({
		fullName: data.name?.full_with_opf,
		address: data.address?.data ? toAddress(data.address.data) : undefined,
	})
}

/**
 * Сначала спрашиваем юрлицо, потом индивидуального предпринимателя.
 *
 * Одним запросом dadata вернула бы обоих, но у ЮЛ и ИП совпадают первые цифры ИНН,
 * и порядок выдачи не гарантирован. Раздельные запросы дают предсказуемый ответ.
 */
export async function findParty(inn: string, { token }: { token?: string }) {
	if (!token || !looksLikeInn(inn)) return undefined

	for (const type of ['LEGAL', 'INDIVIDUAL'] as const) {
		const { suggestions = [] } = await ask<DadataParty>(FIND_PARTY, token, { query: inn.trim(), type })
		if (suggestions[0]) return suggestions[0].data
	}
	return undefined
}
