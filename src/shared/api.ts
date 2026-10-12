/** Ответы ручек /api: их собирает src/backend/server.ts, а разбирает визард. */

import type { FiasAddress } from '#shared/address.ts'
import type { ForwardingOrder } from '#shared/order.ts'
import type { MissingField, OrderSummary, RequestInput } from '#shared/request.ts'

/** Любая ручка при ошибке отвечает так, текст показываем оператору как есть. */
export type ApiError = { error: string }

export type AnalyzeResponse = {
	order: ForwardingOrder
	summary: OrderSummary
	input: RequestInput
	missing: MissingField[]
}

export type BuildResponse = {
	/** Готовые байты заявки в base64: в браузере её не пересобирают и не показывают. */
	file: string
	missing: MissingField[]
}

export type AddressSuggestion = {
	label: string
	address: FiasAddress
}

export type PackagingKind = {
	code: string
	name: string
}
