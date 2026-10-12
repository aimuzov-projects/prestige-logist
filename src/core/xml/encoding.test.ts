import assert from 'node:assert/strict'
import { test } from 'node:test'
import iconv from 'iconv-lite'

import { decodeXml, encodeXml } from '#/core/xml/encoding.ts'

test('заявка уходит в windows-1251', () => {
	const xml = '<?xml version="1.0" encoding="windows-1251"?><Файл Наим="Ёлка «№1»" />'
	const bytes = encodeXml(xml)
	assert.equal(bytes.length, xml.length)
	assert.equal(decodeXml(bytes), xml)
})

test('символ вне 1251 не превращается в «?» молча', () => {
	assert.throws(() => encodeXml('<Файл Наим="⟨x⟩" />'), /«⟨», «⟩»/)
})

test('кодировка входа — из декларации, BOM срезается', () => {
	const xml = '<?xml version="1.0" encoding="utf-8"?><Файл />'
	assert.equal(decodeXml(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(xml)])), xml)
	const cp = '<?xml version="1.0" encoding="windows-1251"?><Файл />'
	assert.equal(decodeXml(iconv.encode(cp, 'windows-1251')), cp)
})
