/**
 * Часовой пояс точки маршрута по коду региона из адреса.
 *
 * В заявке время каждой точки местное: подача и погрузка живут в поясе адреса
 * погрузки, выгрузка — в поясе своего. Коды регионов те же, что в элементе Регион.
 */

import type { FiasAddress } from '#shared/address.ts'

const BY_OFFSET: Record<string, number[]> = {
	'+02:00': [39],
	'+03:00': [
		1, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 20, 21, 23, 26, 29, 31, 32, 33, 34, 35, 36, 37, 40, 43, 44, 46, 47,
		48, 50, 51, 52, 53, 57, 58, 60, 61, 62, 67, 68, 69, 71, 76, 77, 78, 80, 81, 82, 83, 84, 85, 90, 91, 92,
	],
	'+04:00': [18, 30, 63, 64, 73],
	'+05:00': [2, 45, 56, 59, 66, 72, 74, 86, 89],
	'+06:00': [55],
	'+07:00': [4, 17, 19, 22, 24, 42, 54, 70],
	'+08:00': [3, 38],
	'+09:00': [14, 28, 75],
	'+10:00': [25, 27, 79],
	'+11:00': [49, 65],
	'+12:00': [41, 87],
}

/**
 * Два региона на области не делятся — там пояс зависит от района.
 *
 * Якутия растянута на +09/+10/+11, а Сахалин живёт по +11, кроме Северных Курил
 * (+12). Для остальных 83 субъектов области достаточно: так велит закон.
 */
const BY_DISTRICT: Record<number, Record<string, string[]>> = {
	14: {
		'+10:00': ['усть-янский', 'верхоянский', 'оймяконский'],
		'+11:00': ['абыйский', 'аллаиховский', 'верхнеколымский', 'момский', 'нижнеколымский', 'среднеколымский'],
	},
	65: { '+12:00': ['северо-курильск'] },
}

export const DEFAULT_OFFSET = '+03:00'

const OFFSETS = new Map(Object.entries(BY_OFFSET).flatMap(([offset, codes]) => codes.map((code) => [code, offset])))

export function offsetByRegion(region?: string): string | undefined {
	return OFFSETS.get(Number(region))
}

const normalize = (value?: string) =>
	String(value ?? '')
		.toLowerCase()
		.replace(/ё/g, 'е')

/** Названия из адреса, по которым ищем район-исключение: район, поселение, город. */
const placeNames = (address?: FiasAddress) =>
	[address?.municipalDistrict?.name, address?.settlementArea?.name, address?.locality?.name]
		.filter(Boolean)
		.map(normalize)

/** Пояс адреса: сперва район-исключение, потом регион, потом московское время. */
export function offsetByAddress(address?: FiasAddress): string {
	const exceptions = BY_DISTRICT[Number(address?.region)]

	if (exceptions) {
		const places = placeNames(address)

		for (const [offset, districts] of Object.entries(exceptions)) {
			if (districts.some((district) => places.some((place) => place.includes(district)))) {
				return offset
			}
		}
	}

	return offsetByRegion(address?.region) ?? DEFAULT_OFFSET
}
