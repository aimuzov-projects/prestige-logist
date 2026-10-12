/** Форма заявки и всё, чем API и визард обмениваются вокруг неё. */

import type { FiasAddress } from '#shared/address.ts'
import type { Signatory } from '#shared/order.ts'

export type Carrier = {
	kind: 'ЮЛ' | 'ИП'
	inn?: string
	name?: string
	kpp?: string
	ogrn?: string
	ogrnip?: string
	lastName?: string
	firstName?: string
	middleName?: string
	phone?: string
	address?: FiasAddress
	/** Ящика ЭДО у нас нет: сегмент ИдФайл остаётся пустым, получателя проставит Диадок. */
	edmBox?: string
}

export type Forwarder = {
	fullName?: string
	address?: FiasAddress
}

/** Значения, которых нет в поручении: их вводит оператор в форме. */
export type RequestInput = {
	orderNumber?: string
	issuedAt?: Date
	forwarder: Forwarder
	carrier: Carrier
	loadingAddress?: FiasAddress
	unloadingAddress?: FiasAddress
	loadingDate?: string
	unloadingDate?: string
	packageKind?: string
	signatory?: Signatory
}

export type OrderSummary = {
	number?: string
	date?: string
	client: string
	forwarder: string
	consignor: string
	cargo?: string
	packageCount?: string
	grossWeight?: string
	bodyType?: string
	shipment: string
	delivery: string
	from: string
	to: string
}

/** Шаг визарда, на котором живёт обязательное поле. */
export type RequestStep = 'carrier' | 'route' | 'request'

export type MissingField = {
	path: string
	label: string
	step: RequestStep
}

/** В поручении времён нет, только даты. Девять утра — то, с чем работает диспетчер. */
export const DEFAULT_TIME = '09:00:00'
