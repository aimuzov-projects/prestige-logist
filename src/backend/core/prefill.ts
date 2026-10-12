import { addressToText, isTextOnly, type FiasAddress } from '#shared/address.ts'
import type { ForwardingOrder } from '#shared/order.ts'
import type { Carrier, OrderSummary, RequestInput } from '#shared/request.ts'

const byFias = (address?: FiasAddress) => (isTextOnly(address) ? undefined : address)

export type ForwarderDetails = {
	fullName?: string
	address?: FiasAddress
}

/**
 * Значения формы, которые выводятся из поручения. Оператор их видит и правит:
 * именно так в эталоне ЭЗЗ 5661 руками переставили адрес выгрузки.
 *
 * Свои реквизиты собираются из двух источников, и старшинство у них разное.
 * Наименование главнее в ЕГРЮЛ: заявке нужно полное, а поручение везёт краткое.
 * Адрес — наоборот, из поручения: в ЕГРЮЛ он юридический, а возим мы с фактического.
 */
export function prefill(
	order: ForwardingOrder,
	{ forwarderDetails = {} }: { forwarderDetails?: ForwarderDetails } = {},
): RequestInput {
	return {
		orderNumber: undefined,
		forwarder: {
			fullName: forwarderDetails.fullName ?? order.forwarder.name,
			address: byFias(order.forwarderAddress) ?? forwarderDetails.address,
		},
		carrier: { kind: 'ЮЛ' } satisfies Carrier,
		// Текстовый адрес в поля ФИАС не кладём: пусть оператор увидит их пустыми.
		loadingAddress: byFias(order.loadingAddress),
		unloadingAddress: byFias(order.unloadingAddress),
		loadingDate: order.dates.shipmentFrom,
		unloadingDate: order.dates.deliveryFrom,
		signatory: order.signatory,
	}
}

/** Короткая сводка поручения — чтобы оператор убедился, что загрузил тот файл. */
export function summarize(order: ForwardingOrder): OrderSummary {
	return {
		number: order.number,
		date: order.date,
		client: `${order.client.name}, ИНН ${order.client.inn}`,
		forwarder: `${order.forwarder.name}, ИНН ${order.forwarder.inn}`,
		consignor: `${order.consignor.name}, ИНН ${order.consignor.inn}`,
		cargo: order.cargo.name,
		packageCount: order.cargo.packageCount,
		grossWeight: order.cargo.grossWeight,
		bodyType: order.vehicle.bodyType,
		shipment: `${order.dates.shipmentFrom} — ${order.dates.shipmentTo}`,
		delivery: `${order.dates.deliveryFrom} — ${order.dates.deliveryTo}`,
		from: addressToText(order.loadingAddress),
		to: addressToText(order.unloadingAddress),
	}
}
