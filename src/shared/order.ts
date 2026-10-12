/** Разобранное поручение: API отдаёт его клиенту целиком и получает обратно на каждую сборку. */

import type { FiasAddress } from '#shared/address.ts'

export type Organization = {
	name?: string
	inn?: string
	kpp?: string
	ogrn?: string
}

export type PersonName = {
	lastName?: string
	firstName?: string
	middleName?: string
}

export type Signatory = {
	authorityKind?: string
	position?: string
	name?: PersonName
}

export type ForwardingOrder = {
	senderBox?: string
	number?: string
	date?: string
	dates: {
		shipmentFrom?: string
		shipmentTo?: string
		deliveryFrom?: string
		deliveryTo?: string
	}
	client: Organization
	forwarder: Organization
	forwarderAddress: FiasAddress
	consignor: Organization
	cargo: {
		name?: string
		packageCount?: string
		grossWeight?: string
		volume?: string
	}
	vehicle: { bodyType?: string }
	loadingAddress: FiasAddress
	unloadingAddress: FiasAddress
	signatory?: Signatory
}
