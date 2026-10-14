import { el, textEl, type XmlNode } from '#backend/core/xml/serialize.ts'
import { ADDRESS_LEVELS, type AddressPart, type FiasAddress } from '#shared/address.ts'

type XmlElement = Record<string, unknown>

const asArray = (value: unknown): XmlElement[] =>
	value === undefined ? [] : Array.isArray(value) ? value : [value as XmlElement]

const isFilled = (value: unknown) => value !== undefined && value !== null && value !== ''

/** Читает АдрГАР поручения или АдрФИАС заявки в нашу модель. */
export function fromXml(node: XmlElement): FiasAddress {
	const address: FiasAddress = {
		fiasId: node['@ИдНом'] as string | undefined,
		postalCode: node['@Индекс'] as string | undefined,
	}

	for (const { key, element, parts, many } of ADDRESS_LEVELS) {
		if (!parts) {
			if (isFilled(node[element])) Object.assign(address, { [key]: String(node[element]) })

			continue
		}

		const items = asArray(node[element]).map((item) =>
			Object.fromEntries(
				Object.entries(parts)
					.filter(([, fns]) => isFilled(item[`@${fns}`]))
					.map(([own, fns]) => [own, String(item[`@${fns}`])]),
			),
		)

		if (items.length) Object.assign(address, { [key]: many ? items : items[0] })
	}

	return address
}

/** Дочерние узлы АдрФИАС в порядке XSD-sequence. */
export function toNodes(address: FiasAddress = {}): XmlNode[] {
	return ADDRESS_LEVELS.flatMap(({ key, element, parts }) => {
		const value = address[key]

		if (!isFilled(value)) return []

		if (!parts) return [textEl(element, value as string)]

		return (Array.isArray(value) ? value : [value as AddressPart])
			.map((item) =>
				Object.fromEntries(
					Object.entries(parts)
						.filter(([own]) => isFilled(item?.[own as keyof AddressPart]))
						.map(([own, fns]) => [fns, String(item[own as keyof AddressPart])]),
				),
			)
			.filter((attrs) => Object.keys(attrs).length)
			.map((attrs) => el(element, attrs))
	})
}

/** Адрес заявки — всегда АдрФИАС, обёрнутый в Адрес. КодСтр нужен не везде, потому и опция. */
export function addressNode(address?: FiasAddress, { countryCode }: { countryCode?: string } = {}) {
	return el('Адрес', {}, [
		el('АдрФИАС', { КодСтр: countryCode, ИдНом: address?.fiasId, Индекс: address?.postalCode }, toNodes(address)),
	])
}
