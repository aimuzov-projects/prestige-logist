/**
 * Что оператор обязан заполнить сам. Всё остальное либо приходит из поручения,
 * либо подтягивается из ЕГРЮЛ, либо зашито константой в сборщике заявки.
 *
 * Правила общие: браузер считает по ним подсветку на каждую правку, не дожидаясь
 * сборки, а сервер — заглушки в черновике XML.
 */

import { isTextOnly } from '#shared/address.ts'
import type { MissingField, RequestInput } from '#shared/request.ts'

export type RequiredField = {
	path: string
	label: string
	/** Шаг визарда, на котором это поле живёт. */
	step: 'carrier' | 'route' | 'request'
	filled: (input: RequestInput) => boolean
}

const hasFias = (input: RequestInput, key: 'loadingAddress' | 'unloadingAddress') => {
	const address = input[key]
	return Boolean(address && !isTextOnly(address) && Object.keys(address).length)
}

/** В порядке шагов и полей формы: в этом же порядке их видит оператор в списке пропусков. */
export const REQUIRED_FIELDS: RequiredField[] = [
	{
		path: 'carrier.inn',
		label: 'ИНН перевозчика',
		step: 'carrier',
		filled: (input) => Boolean(input.carrier.inn?.trim()),
	},
	{
		path: 'carrier.name',
		label: 'Наименование перевозчика',
		step: 'carrier',
		filled: (input) =>
			input.carrier.kind === 'ЮЛ'
				? Boolean(input.carrier.name?.trim())
				: Boolean(input.carrier.lastName?.trim() && input.carrier.firstName?.trim()),
	},
	{
		path: 'carrier.address',
		label: 'Адрес перевозчика',
		step: 'carrier',
		filled: (input) => Boolean(Object.keys(input.carrier.address ?? {}).length),
	},
	{
		path: 'loadingAddress',
		label: 'Адрес погрузки',
		step: 'route',
		filled: (input) => hasFias(input, 'loadingAddress'),
	},
	{
		path: 'loadingDate',
		label: 'Дата подачи',
		step: 'route',
		filled: (input) => Boolean(input.loadingDate),
	},
	{
		path: 'unloadingAddress',
		label: 'Адрес выгрузки',
		step: 'route',
		filled: (input) => hasFias(input, 'unloadingAddress'),
	},
	{
		path: 'unloadingDate',
		label: 'Дата выгрузки',
		step: 'route',
		filled: (input) => Boolean(input.unloadingDate),
	},
	{
		path: 'orderNumber',
		label: 'Номер заказа',
		step: 'request',
		filled: (input) => Boolean(input.orderNumber?.trim()),
	},
	{
		path: 'forwarder.fullName',
		label: 'Полное наименование грузоотправителя',
		step: 'request',
		filled: (input) => Boolean(input.forwarder.fullName?.trim()),
	},
	{
		path: 'forwarder.address',
		label: 'Адрес грузоотправителя',
		step: 'request',
		filled: (input) => Boolean(Object.keys(input.forwarder.address ?? {}).length),
	},
]

export function missingFields(input: RequestInput): MissingField[] {
	return REQUIRED_FIELDS.filter((field) => !field.filled(input)).map(({ path, label, step }) => ({
		path,
		label,
		step,
	}))
}
