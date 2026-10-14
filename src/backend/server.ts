/**
 * API конвертера: пять ручек под /api, состояния между запросами нет.
 *
 * Node запускает этот файл сам, без сборки. Ядро в src/core работает только здесь:
 * оно читает zip и пишет windows-1251, браузеру оно отдаёт лишь типы.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

import { missingFields, withPlaceholders } from '#backend/core/fields.ts'
import { parseForwardingOrder } from '#backend/core/order/parse.ts'
import { readInput } from '#backend/core/order/read-input.ts'
import { prefill, summarize } from '#backend/core/prefill.ts'
import { buildCarriageRequest } from '#backend/core/request/build.ts'
import { encodeXml } from '#backend/core/xml/encoding.ts'
import { searchAddresses } from '#backend/dadata.ts'
import { carrierByInn, dadataToken, forwarderByInn } from '#backend/lookup.ts'
import { searchPackaging } from '#backend/packaging.ts'
import type { AnalyzeResponse, BuildResponse } from '#shared/api.ts'
import type { ForwardingOrder } from '#shared/order.ts'
import type { RequestInput } from '#shared/request.ts'

const PORT = Number(process.env.PORT ?? 8787)
const LIMIT = 20 * 1024 * 1024

type Reply = [status: number, body: unknown]
type Handler = (url: URL, request: IncomingMessage) => Promise<Reply>

class TooLarge extends Error {}

async function readBody(request: IncomingMessage): Promise<Buffer> {
	const chunks: Buffer[] = []
	let size = 0

	for await (const chunk of request) {
		size += chunk.length

		if (size > LIMIT) throw new TooLarge()

		chunks.push(chunk)
	}

	return Buffer.concat(chunks)
}

const failure = (status: number, error: unknown): Reply => [status, { error: (error as Error).message }]

/**
 * Разобранное поручение уезжает клиенту целиком: он держит его у себя и присылает
 * обратно на сборку. Так не приходится ни гонять zip на каждую правку формы,
 * ни хранить состояние на сервере.
 */
const analyze: Handler = async (_, request) => {
	const order = parseForwardingOrder(readInput(await readBody(request)))
	const forwarderDetails = await forwarderByInn(order.forwarder.inn)
	const input = prefill(order, { forwarderDetails })

	return [200, { order, summary: summarize(order), input, missing: missingFields(input) } satisfies AnalyzeResponse]
}

/**
 * Собираем даже неполную заявку: незаполненное уходит в XML заглушками, а скачивание
 * закрыто, пока список пропусков не опустеет.
 */
const build: Handler = async (_, request) => {
	const { order, input } = JSON.parse((await readBody(request)).toString('utf8')) as {
		order: ForwardingOrder
		input: RequestInput
	}
	const missing = missingFields(input)
	// Отметка о формировании — момент сборки, поэтому ставим её здесь, а не в форме.
	const draft = { ...withPlaceholders(input, missing), issuedAt: new Date() }
	const xml = buildCarriageRequest(order, draft)

	// Отдаём только байты в windows-1251: Логистика не смотрит на декларацию кодировки.
	return [200, { file: encodeXml(xml).toString('base64'), missing } satisfies BuildResponse]
}

const routes: Record<string, Handler> = {
	'POST /api/analyze': analyze,
	'POST /api/build': build,

	/** Поиск адреса по ФИАС: оператор набирает строку, выбирает вариант, поля заполняются. */
	'GET /api/address': async (url) => [
		200,
		{ suggestions: await searchAddresses(url.searchParams.get('query') ?? '', { token: dadataToken }) },
	],

	/** Незнакомый ИНН не ошибка — оператор введёт реквизиты сам. */
	'GET /api/carrier': async (url) => [
		200,
		{ carrier: (await carrierByInn(url.searchParams.get('inn') ?? '')) ?? null },
	],

	/** Виды тары для атрибута ВидТар: оператор ищет «поддон» и получает код 8A. */
	'GET /api/packaging': async (url) => {
		try {
			return [200, { kinds: await searchPackaging(url.searchParams.get('query') ?? '') }]
		} catch (error) {
			return failure(502, error)
		}
	},

	'GET /api/health': async () => [200, { ok: true }],
}

async function handle(request: IncomingMessage, response: ServerResponse) {
	const url = new URL(request.url ?? '/', 'http://localhost')
	const route = routes[`${request.method} ${url.pathname}`]

	let status: number
	let body: unknown

	try {
		;[status, body] = route ? await route(url, request) : [404, { error: 'Нет такой ручки' }]
	} catch (error) {
		;[status, body] =
			error instanceof TooLarge
				? [413, { error: 'Файл больше 20 МБ — это точно комплект поручения?' }]
				: failure(400, error)
	}

	response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
	response.end(JSON.stringify(body))
}

createServer(handle).listen(PORT, () => console.log(`api: http://localhost:${PORT}`))
