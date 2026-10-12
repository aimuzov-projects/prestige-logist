import assert from 'node:assert/strict'
import { test } from 'node:test'

import { offsetByAddress } from '#backend/core/timezone.ts'

test('пояс по региону, району-исключению и по умолчанию', () => {
	assert.equal(offsetByAddress({ region: '66' }), '+05:00')
	assert.equal(offsetByAddress({ region: '14', municipalDistrict: { name: 'Оймяконский улус' } }), '+10:00')
	assert.equal(offsetByAddress({ region: '65', locality: { name: 'Северо-Курильск' } }), '+12:00')
	assert.equal(offsetByAddress(undefined), '+03:00')
})
