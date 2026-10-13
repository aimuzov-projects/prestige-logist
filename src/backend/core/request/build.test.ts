import assert from 'node:assert/strict'
import { test } from 'node:test'

import { missingFields, withPlaceholders } from '#backend/core/fields.ts'
import { CLIENT_TITLE, FORWARDER_TITLE } from '#backend/core/fixtures/order.ts'
import { parseForwardingOrder } from '#backend/core/order/parse.ts'
import { prefill } from '#backend/core/prefill.ts'
import { buildCarriageRequest } from '#backend/core/request/build.ts'
import type { RequestInput } from '#shared/request.ts'

const order = parseForwardingOrder({ client: CLIENT_TITLE, forwarder: FORWARDER_TITLE })

test('разбор поручения', () => {
	assert.equal(order.number, 'П-17')
	assert.equal(order.senderBox, '2BM-EXP')
	assert.equal(order.forwarder.inn, '6300000002')
	assert.equal(order.cargo.grossWeight, '1500')
	assert.equal(order.loadingAddress.fiasId, 'fias-loading')
	assert.deepEqual(order.unloadingAddress, { text: 'Москва, Тверская, 1' })
	assert.equal(order.signatory?.name?.firstName, 'Пётр')
})

test('текстовый адрес в форму не попадает, а значит и не считается заполненным', () => {
	const input = prefill(order)
	assert.equal(input.unloadingAddress, undefined)
	assert.deepEqual(
		missingFields(input).map(({ path }) => path),
		['carrier.inn', 'carrier.name', 'carrier.address', 'unloadingAddress', 'orderNumber'],
	)
})

test('сборка заявки', () => {
	const input: RequestInput = {
		...prefill(order),
		orderNumber: 'З-1',
		carrier: { kind: 'ЮЛ', inn: '7700000009', name: 'ООО "Перевозчик"', address: { region: '77' } },
		unloadingAddress: { fiasId: 'fias-unloading', region: '77' },
		packageKind: '8A',
		issuedAt: new Date(2026, 8, 1, 10, 20, 30),
	}
	assert.deepEqual(missingFields(input), [])

	const xml = buildCarriageRequest(order, input, { uuid: 'uuid' })
	assert.match(
		xml,
		/^<\?xml version="1.0" encoding="windows-1251"\?>\r\n<Файл ИдФайл="ON_ZAKZVGO__2BM-EXP_0_20260901_uuid"/,
	)
	// Пояс у каждой точки свой: Екатеринбург +05, Москва +03.
	assert.match(xml, /Опер="Погрузка" ПорНомПункт="1" ДатВрОпер="02.09.2026T09:00:00\+05:00"/)
	assert.match(xml, /Опер="Выгрузка" ПорНомПункт="2" ДатВрОпер="05.09.2026T09:00:00\+03:00"/)
	assert.match(xml, /НаимВладИнфр="АО «Завод»"/)
	assert.match(xml, /ВидТар="8A"/)
	assert.match(xml, /ТипПогр="бок"/)
	assert.match(xml, /<ФИО Фамилия="Петров" Имя="Пётр" Отчество="Петрович" \/>/)
	assert.ok(!xml.endsWith('\n'))
})

test('незаполненное уходит в черновик заглушками', () => {
	const input = prefill(order)
	const xml = buildCarriageRequest(order, withPlaceholders(input, missingFields(input)))
	assert.match(xml, /НомЗак="\[\[Номер заказа\]\]"/)
})
