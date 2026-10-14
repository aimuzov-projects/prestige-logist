/** Приведение значений к тому виду, в котором их пишут Диадок и Контур Логистика. */

import { REQUEST_PREFIX } from '#backend/core/request/constants.ts'

/**
 * ПЭ описывает кузов словом, заявка — кодом типа погрузки.
 *
 * Незнакомое значение не переводим: в поручениях из 1С попадается «Грузовой,
 * открытый», и любая догадка тут хуже пустого поля, которое оператор заполнит сам.
 */
const LOADING_TYPES: Record<string, string> = {
	Боковая: 'бок',
	Задняя: 'задн',
	Верхняя: 'верх',
}

export const loadingType = (bodyType?: string) => (bodyType ? LOADING_TYPES[bodyType] : undefined)

/**
 * Телефон приводим к виду, в котором его пишет Диадок: 89278962210.
 * В поручениях из 1С он приходит как «+7 (927) 8962210».
 */
export function normalizePhone(phone?: string): string | undefined {
	if (!phone) return undefined

	const digits = String(phone).replace(/\D/g, '')

	if (digits.length === 11 && digits.startsWith('7')) return `8${digits.slice(1)}`

	return digits || undefined
}

/** Диадок печатает наименование владельца инфраструктуры в ёлочках, ПЭ — в лапках. */
export function toGuillemets(name = ''): string {
	return name.replace(/"([^"]*)"/g, '«$1»')
}

/**
 * Время всегда ЧЧ:ММ:СС — «10:30» Контур Логистика не разбирает и оставляет поле
 * пустым. Заглушки черновика пропускаем как есть, они и так видны глазом.
 */
export function normalizeTime(time?: string): string | undefined {
	const parts = String(time ?? '')
		.trim()
		.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)

	if (!parts) return time

	const [, hours, minutes, seconds = '00'] = parts

	return `${hours.padStart(2, '0')}:${minutes}:${seconds}`
}

/** Дата всегда ДД.ММ.ГГГГ. Поле формы отдаёт ISO, поэтому переворачиваем. */
export function normalizeDate(date?: string): string | undefined {
	const iso = String(date ?? '')
		.trim()
		.match(/^(\d{4})-(\d{2})-(\d{2})$/)

	return iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : date
}

/** ДатВрОпер и ДатВрПод склеиваются как «31.08.2026T14:00:00+03:00». */
export function dateTime(date?: string, time?: string, offset?: string): string {
	return `${normalizeDate(date)}T${normalizeTime(time)}${offset}`
}

/**
 * ИдФайл: ON_ZAKZVGO_{получатель}_{отправитель}_0_{ГГГГММДД}_{uuid}.
 *
 * Получатель — ящик перевозчика, отправитель — экспедитора. Ящика перевозчика у нас
 * нет: его негде взять, поэтому сегмент остаётся пустым, а получателя проставит Диадок.
 */
export function requestFileId({
	recipientBox = '',
	senderBox,
	date,
	uuid,
}: {
	recipientBox?: string
	senderBox?: string
	date: string
	uuid: string
}): string {
	return [REQUEST_PREFIX, recipientBox, senderBox, '0', date, uuid].join('_')
}

/** «31.08.2026» в «20260831» для ИдФайл. */
export function toCompactDate(date: string): string {
	const [day, month, year] = date.split('.')

	return `${year}${month}${day}`
}

const twoDigits = (value: number) => String(value).padStart(2, '0')

/** ДатИнфГО как ДД.ММ.ГГГГ. Дата берётся по поясу процесса, а не точки маршрута. */
export function fnsDate(moment: Date): string {
	return `${twoDigits(moment.getDate())}.${twoDigits(moment.getMonth() + 1)}.${moment.getFullYear()}`
}

/** ВрИнфГО как ЧЧ:ММ:СС, тоже по поясу процесса. */
export function fnsTime(moment: Date): string {
	return [moment.getHours(), moment.getMinutes(), moment.getSeconds()].map(twoDigits).join(':')
}
