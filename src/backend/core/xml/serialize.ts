/**
 * Минимальный сериализатор XML под форматы ФНС.
 *
 * Готовые сборщики не дают гарантий по порядку атрибутов и по тому, как
 * схлопывается пустой элемент. А в ФНС-форматах порядок значим для XSD-sequence,
 * и побайтовая сверка с эталоном — основной способ проверки. Поэтому пишем сами.
 */

import { REQUEST_ENCODING } from '#backend/core/xml/encoding.ts'

export type XmlNode = {
	name: string
	attrs: Record<string, string>
	children?: XmlNode[]
	text?: string
}

export type XmlAttrs = Record<string, string | number | undefined | null>

/** Узел дерева. Атрибуты со значением undefined/null/'' отбрасываются. */
export function el(
	name: string,
	attrs: XmlAttrs = {},
	children: Array<XmlNode | false | undefined | null> = [],
): XmlNode {
	const clean: Record<string, string> = {}

	for (const [key, value] of Object.entries(attrs)) {
		if (value !== undefined && value !== null && value !== '') clean[key] = String(value)
	}

	return { name, attrs: clean, children: children.filter(Boolean) as XmlNode[] }
}

/** Узел с текстовым содержимым: <Регион>77</Регион>. */
export function textEl(name: string, value: string | number): XmlNode {
	return { name, attrs: {}, text: String(value) }
}

const escapeAttr = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const escapeText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function renderNode(node: XmlNode, depth: number, indent: string): string {
	const pad = indent.repeat(depth)
	const attrs = Object.entries(node.attrs)
		.map(([key, value]) => ` ${key}="${escapeAttr(value)}"`)
		.join('')

	if (node.text !== undefined) {
		return `${pad}<${node.name}${attrs}>${escapeText(node.text)}</${node.name}>`
	}

	if (!node.children?.length) return `${pad}<${node.name}${attrs} />`

	const inner = node.children.map((child) => renderNode(child, depth + 1, indent)).join('\n')

	return `${pad}<${node.name}${attrs}>\n${inner}\n${pad}</${node.name}>`
}

export type SerializeOptions = {
	encoding?: string
	indent?: string
	eol?: string
}

export function serialize(
	root: XmlNode,
	{ encoding = REQUEST_ENCODING, indent = '  ', eol = '\r\n' }: SerializeOptions = {},
): string {
	const body = renderNode(root, 0, indent).split('\n').join(eol)

	// Диадок закрывает файл сразу после корня, без перевода строки.
	// Держим тот же вид байт в байт.
	return `<?xml version="1.0" encoding="${encoding}"?>${eol}${body}`
}
