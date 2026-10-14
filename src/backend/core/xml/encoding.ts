import iconv from 'iconv-lite'

const BOM_UTF8 = [0xef, 0xbb, 0xbf]

export const REQUEST_ENCODING = 'windows-1251'

const isUtf8 = (encoding: string) => /^utf-?8$/i.test(encoding)

/**
 * Диадок отдаёт документы кто в utf-8, кто в windows-1251, и не всегда с BOM.
 * Кодировку берём из XML-декларации, BOM просто срезаем.
 */
export function decodeXml(buffer: Buffer): string {
	const withoutBom = BOM_UTF8.every((byte, i) => buffer[i] === byte) ? buffer.subarray(3) : buffer
	const declaration = withoutBom.subarray(0, 120).toString('latin1')
	const encoding = declaration.match(/encoding=["']([^"']+)["']/i)?.[1] ?? 'utf-8'

	return iconv.decode(withoutBom, isUtf8(encoding) ? 'utf-8' : encoding)
}

/**
 * Заявку отдаём в windows-1251 — так её пишут и Диадок, и Контур Логистика.
 * В utf-8 Логистика разбирает файл как 1251 и не видит ни одного поля.
 *
 * Символ, которого нет в 1251, iconv молча заменит на «?». Ловим это здесь:
 * испорченное значение принимающая сторона просто не разберёт, и искать будет нечего.
 */
export function encodeXml(xml: string, encoding: string = REQUEST_ENCODING): Buffer {
	if (isUtf8(encoding)) return Buffer.from(xml, 'utf8')

	const bytes = iconv.encode(xml, encoding)

	if (iconv.decode(bytes, encoding) === xml) return bytes

	const survives = (char: string) => iconv.decode(iconv.encode(char, encoding), encoding) === char
	const broken = [...new Set(xml)].filter((char) => !survives(char))

	throw new Error(
		`Символы ${broken.map((c) => `«${c}»`).join(', ')} не существуют в ${encoding} ` +
			'и превратились бы в «?». Замените их на ASCII или кириллицу.',
	)
}
