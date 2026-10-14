import type { MissingField, RequestInput } from '#shared/request.ts'

export { missingFields } from '#shared/fields.ts'

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
