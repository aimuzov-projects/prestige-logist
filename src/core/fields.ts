/**
 * Что оператор обязан заполнить сам. Всё остальное либо приходит из поручения,
 * либо подтягивается из ЕГРЮЛ, либо зашито константой в сборщике заявки.
 */

import { isTextOnly } from '#/core/address/schema.ts'
import type { RequestInput } from '#/core/request/build.ts'

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

export const REQUIRED_FIELDS: RequiredField[] = [
	{
		path: 'orderNumber',
		label: 'Номер заказа',
		step: 'request',
		filled: (input) => Boolean(input.orderNumber?.trim()),
	},
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
	{
		path: 'loadingAddress',
		label: 'Адрес погрузки',
		step: 'route',
		filled: (input) => hasFias(input, 'loadingAddress'),
	},
	{
		path: 'unloadingAddress',
		label: 'Адрес выгрузки',
		step: 'route',
		filled: (input) => hasFias(input, 'unloadingAddress'),
	},
	{
		path: 'loadingDate',
		label: 'Дата подачи',
		step: 'route',
		filled: (input) => Boolean(input.loadingDate),
	},
	{
		path: 'unloadingDate',
		label: 'Дата выгрузки',
		step: 'route',
		filled: (input) => Boolean(input.unloadingDate),
	},
]

export type MissingField = {
	path: string
	label: string
	step: RequiredField['step']
}

export function missingFields(input: RequestInput): MissingField[] {
	return REQUIRED_FIELDS.filter((field) => !field.filled(input)).map(({ path, label, step }) => ({
		path,
		label,
		step,
	}))
}

/**
 * Заглушки видно прямо в XML черновика. Скобки только ASCII: в windows-1251
 * «⟨⟩» превращаются в «?», и дата вида 01.09.2026T?Время?+03:00 молча ломается.
 */
export function withPlaceholders(input: RequestInput, missing: MissingField[]): RequestInput {
	const draft = structuredClone(input)
	for (const field of missing) {
		if (field.path === 'orderNumber') draft.orderNumber = `[[${field.label}]]`
		if (field.path === 'carrier.name' && draft.carrier.kind === 'ЮЛ') {
			draft.carrier.name = `[[${field.label}]]`
		}
		if (field.path === 'loadingDate') draft.loadingDate = `[[${field.label}]]`
		if (field.path === 'unloadingDate') draft.unloadingDate = `[[${field.label}]]`
	}
	return draft
}
