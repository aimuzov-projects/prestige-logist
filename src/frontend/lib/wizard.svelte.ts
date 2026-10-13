/**
 * Состояние визарда: поручение, форма, собранная заявка и шаги.
 *
 * Разобранную модель держим на клиенте и шлём обратно на сборку — так zip поднимается
 * на сервер ровно один раз, а состояния там не остаётся вовсе. Поля формы правятся
 * прямо в `wizard.input`: руны отслеживают его вглубь.
 */

import { api, later } from '#frontend/lib/api.ts'
import type { AnalyzeResponse, BuildResponse } from '#shared/api.ts'
import { missingFields } from '#shared/fields.ts'
import type { ForwardingOrder } from '#shared/order.ts'
import type { Carrier, OrderSummary, RequestInput } from '#shared/request.ts'

export const STEPS = [
	{ id: 'upload', title: 'Поручение' },
	{ id: 'carrier', title: 'Перевозчик' },
	{ id: 'route', title: 'Маршрут' },
	{ id: 'request', title: 'Заявка' },
] as const

export type StepId = (typeof STEPS)[number]['id']

/** Какое из полей адреса сейчас ищут: погрузка, выгрузка или чей-то реквизит. */
export type AddressTarget = 'loadingAddress' | 'unloadingAddress' | 'carrier' | 'forwarder'

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
	/**
	 * Пропуски считаем здесь же, по тем же правилам, что и сервер: ответа сборки ждать
	 * незачем, а с ним подсветка отставала от правки на паузу и запрос.
	 */
	missing = $derived(this.input ? missingFields(this.input) : [])
	isComplete = $derived(Boolean(this.order) && this.missing.length === 0)
	/** Пути незаполненного, вроде `carrier.inn`: по ним форма подсвечивает свои поля. */
	missingPaths = $derived(new Set(this.missing.map((field) => field.path)))

	/** Сколько незаполненного осталось на каждом шаге — показываем прямо на вкладках. */
	missingByStep = $derived.by(() => {
		const counts: Partial<Record<StepId, number>> = {}
		for (const field of this.missing) counts[field.step] = (counts[field.step] ?? 0) + 1
		return counts
	})

	/** Имя файла заявки: по номеру заказа, а без него — просто черновик. */
	downloadName = $derived(`zayavka-${this.input?.orderNumber?.trim() || 'draft'}.xml`)
	canDownload = $derived(this.isComplete && !this.building && Boolean(this.request.file))

	/** Короткое сообщение внизу экрана; гаснет само. */
	notice = $state('')
	#noticeTimer: ReturnType<typeof setTimeout> | undefined

	notify(text: string) {
		this.notice = text
		clearTimeout(this.#noticeTimer)
		this.#noticeTimer = setTimeout(() => (this.notice = ''), 4000)
	}

	/**
	 * Кнопка «Скачать заявку» не гаснет: нажали раньше времени — объясняем, чего не хватает,
	 * и ведём к разделу с первым пропуском.
	 */
	tryDownload = () => {
		const missing = this.missing
		if (missing.length) {
			const names = missing.slice(0, 3).map((field) => field.label)
			const rest = missing.length - names.length
			this.notify(`Заполните: ${names.join(', ')}${rest > 0 ? ` и ещё ${rest}` : ''}`)
			this.goTo(missing[0].step)
			return
		}
		if (!this.canDownload) {
			this.notify('Собираем заявку, нажмите через секунду')
			return
		}
		this.download()
	}

	/**
	 * Файл отдаём ровно теми байтами, что собрал сервер: windows-1251, иначе Логистика
	 * его не прочтёт. Пересобирать в браузере нечего — base64 уже пришёл готовым.
	 */
	download = () => {
		if (!this.canDownload) return
		const bytes = Uint8Array.from(atob(this.request.file), (char) => char.charCodeAt(0))
		const url = URL.createObjectURL(new Blob([bytes], { type: 'application/xml' }))
		Object.assign(document.createElement('a'), { href: url, download: this.downloadName }).click()
		URL.revokeObjectURL(url)
	}

	carrierInn = $derived(this.input?.carrier.inn?.trim())
	/** Как перевозчика называть людям: наименование юрлица или ФИО предпринимателя. */
	carrierName = $derived.by(() => {
		const carrier = this.input?.carrier
		if (carrier?.kind === 'ИП') {
			return [carrier.lastName, carrier.firstName, carrier.middleName].filter(Boolean).join(' ')
		}
		return carrier?.name?.trim() ?? ''
	})
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

	/**
	 * Раздел, к которому сейчас едет прокрутка. Пока едет, слежение за экраном молчит:
	 * иначе подсветка в сайдбаре перебрала бы все разделы по пути.
	 */
	#scrollingTo: StepId | null = null
	#settle: ReturnType<typeof setTimeout> | undefined

	/** Форма одна длинная: шаг — это раздел, к которому прокручиваем. */
	goTo(id: StepId) {
		if (id !== 'upload' && !this.order) return
		this.step = id
		this.#scrollingTo = id
		const still = matchMedia('(prefers-reduced-motion: reduce)').matches
		document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
		// scrollend есть не везде, поэтому слежение возвращаем и по таймеру.
		clearTimeout(this.#settle)
		this.#settle = setTimeout(() => this.settle(), 900)
	}

	/** Раздел, который сейчас на экране, — от прокрутки самого пользователя. */
	spy(id: StepId) {
		if (!this.#scrollingTo) this.step = id
	}

	settle() {
		clearTimeout(this.#settle)
		this.#scrollingTo = null
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
