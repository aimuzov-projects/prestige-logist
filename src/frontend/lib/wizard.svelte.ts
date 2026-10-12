/**
 * Состояние визарда: поручение, форма, собранная заявка и шаги.
 *
 * Разобранную модель держим на клиенте и шлём обратно на сборку — так zip поднимается
 * на сервер ровно один раз, а состояния там не остаётся вовсе. Поля формы правятся
 * прямо в `wizard.input`: руны отслеживают его вглубь.
 */

import type { MissingField } from '#/core/fields.ts'
import type { ForwardingOrder } from '#/core/order/parse.ts'
import type { OrderSummary } from '#/core/prefill.ts'
import type { Carrier, RequestInput } from '#/core/request/build.ts'
import { api, later } from '#/frontend/lib/api.ts'

export const STEPS = [
	{ id: 'upload', title: 'Поручение' },
	{ id: 'carrier', title: 'Перевозчик' },
	{ id: 'route', title: 'Маршрут' },
	{ id: 'request', title: 'Заявка' },
] as const

export type StepId = (typeof STEPS)[number]['id']

/** Какое из полей адреса сейчас ищут: погрузка, выгрузка или чей-то реквизит. */
export type AddressTarget = 'loadingAddress' | 'unloadingAddress' | 'carrier' | 'forwarder'

type AnalyzeResponse = {
	order: ForwardingOrder
	summary: OrderSummary
	input: RequestInput
	missing: MissingField[]
}

type BuildResponse = {
	/** Готовые байты заявки в base64: в браузере её не пересобирают и не показывают. */
	file: string
	missing: MissingField[]
}

const EMPTY: BuildResponse = { file: '', missing: [] }

const looksLikeInn = (inn?: string) => Boolean(inn && /^(\d{10}|\d{12})$/.test(inn))

class Wizard {
	order = $state<ForwardingOrder | null>(null)
	summary = $state<OrderSummary | null>(null)
	input = $state<RequestInput | null>(null)
	/** Имя загруженного файла — оператору важно видеть, что он взял тот комплект. */
	fileName = $state('')
	analyzing = $state(false)
	analyzeError = $state('')

	step = $state<StepId>('upload')
	stepIndex = $derived(STEPS.findIndex(({ id }) => id === this.step))

	request = $state<BuildResponse>(EMPTY)
	building = $state(false)
	buildError = $state('')
	missing = $derived(this.request.missing)
	isComplete = $derived(Boolean(this.order) && this.missing.length === 0)

	/** Сколько незаполненного осталось на каждом шаге — показываем прямо на вкладках. */
	missingByStep = $derived.by(() => {
		const counts: Partial<Record<StepId, number>> = {}
		for (const field of this.missing) counts[field.step] = (counts[field.step] ?? 0) + 1
		return counts
	})

	/** Имя файла заявки: по номеру заказа, а без него — просто черновик. */
	downloadName = $derived(`zayavka-${this.input?.orderNumber?.trim() || 'draft'}.xml`)

	carrierInn = $derived(this.input?.carrier.inn?.trim())
	/** Реквизиты, найденные по ИНН; null — не искали или в реестре нет. */
	carrierFound = $state<Carrier | null>(null)
	carrierSearching = $state(false)
	/** ИНН, реквизиты которого уже разложены по форме. Не руна: на него никто не подписан. */
	#appliedInn: string | undefined

	addressTarget = $state<AddressTarget | null>(null)

	async analyze(file: File) {
		this.analyzing = true
		this.analyzeError = ''
		try {
			const result = await api<AnalyzeResponse>('/api/analyze', {
				method: 'POST',
				body: await file.arrayBuffer(),
			})
			this.order = result.order
			this.summary = result.summary
			this.input = result.input
			this.request = { file: '', missing: result.missing }
			this.fileName = file.name
		} catch (error) {
			this.analyzeError = (error as Error).message
		} finally {
			this.analyzing = false
		}
	}

	goTo(id: StepId) {
		if (id !== 'upload' && !this.order) return
		this.step = id
	}

	next = () => {
		if (this.stepIndex < STEPS.length - 1) this.goTo(STEPS[this.stepIndex + 1].id)
	}

	back = () => {
		if (this.stepIndex > 0) this.goTo(STEPS[this.stepIndex - 1].id)
	}

	/**
	 * Фоновые пересчёты. Зовёт корневой компонент: руне $effect нужен владелец.
	 *
	 * Каждый эффект сам отменяет прошлый запрос через AbortController, поэтому быстрый
	 * набор не оставляет ответов, пришедших не в том порядке.
	 */
	connect() {
		// Заявка пересобирается на каждую правку. JSON.stringify читает форму целиком,
		// и эффект подписывается на любое её поле.
		$effect(() => {
			if (!this.order || !this.input) {
				this.request = EMPTY
				this.building = false
				return
			}
			const body = JSON.stringify({ order: this.order, input: this.input })
			const controller = new AbortController()
			this.building = true

			// Пауза гасит поток промежуточных сборок, пока оператор печатает.
			later(300, controller.signal, async () => {
				try {
					this.request = await api<BuildResponse>('/api/build', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body,
						signal: controller.signal,
					})
					this.buildError = ''
				} catch (error) {
					if (!controller.signal.aborted) this.buildError = (error as Error).message
				} finally {
					if (!controller.signal.aborted) this.building = false
				}
			})
			return () => controller.abort()
		})

		// Реквизиты перевозчика по ИНН. Найденное ложится под ввод оператора: правку руками
		// оно не затирает, а сам ИНН остаётся тем, что набрали.
		$effect(() => {
			const inn = this.carrierInn
			// Стёрли или сменили ИНН — карточку чистим сразу, не дожидаясь справочника:
			// реквизиты прежнего перевозчика не должны молча уехать в заявку под чужим ИНН.
			if (this.#appliedInn && this.#appliedInn !== inn && this.input) {
				this.#appliedInn = undefined
				this.input.carrier = { kind: 'ЮЛ', inn }
			}
			this.carrierFound = null
			if (!looksLikeInn(inn)) return

			const controller = new AbortController()
			this.carrierSearching = true
			later(400, controller.signal, async () => {
				try {
					const { carrier } = await api<{ carrier: Carrier | null }>(`/api/carrier?inn=${inn}`, {
						signal: controller.signal,
					})
					this.carrierFound = carrier
					// Повторно найденное не подставляем, иначе правка руками откатывалась бы к реестровой.
					if (carrier && inn !== this.#appliedInn && this.input) {
						this.#appliedInn = inn
						this.input.carrier = { ...carrier, inn }
					}
				} catch {
					// Справочник молчит — оператор введёт реквизиты сам.
				} finally {
					if (!controller.signal.aborted) this.carrierSearching = false
				}
			})
			return () => controller.abort()
		})
	}
}

export const wizard = new Wizard()
