<script lang="ts">
	import Check from '@lucide/svelte/icons/check'
	import CircleHelp from '@lucide/svelte/icons/circle-help'
	import ClipboardList from '@lucide/svelte/icons/clipboard-list'
	import FileInput from '@lucide/svelte/icons/file-input'
	import RouteIcon from '@lucide/svelte/icons/route'
	import Truck from '@lucide/svelte/icons/truck'

	import MissingList from '#frontend/components/missing-list.svelte'
	import Logo from '#frontend/components/logo.svelte'
	import StepNav from '#frontend/components/step-nav.svelte'
	import ThemeToggle from '#frontend/components/theme-toggle.svelte'
	import CarrierStep from '#frontend/components/steps/carrier-step.svelte'
	import RequestStep from '#frontend/components/steps/request-step.svelte'
	import RouteStep from '#frontend/components/steps/route-step.svelte'
	import UploadStep from '#frontend/components/steps/upload-step.svelte'
	import type { FiasAddress } from '#shared/address.ts'
	import { STEPS, wizard, type StepId } from '#frontend/lib/wizard.svelte.ts'

	const VIEWS = { upload: UploadStep, carrier: CarrierStep, route: RouteStep, request: RequestStep }

	/** Иконка вместо порядкового номера: по ней шаг узнаётся быстрее, чем по цифре. */
	const ICONS = { upload: FileInput, carrier: Truck, route: RouteIcon, request: ClipboardList }

	wizard.connect()

	const View = $derived(VIEWS[wizard.step])
	const loaded = $derived(Boolean(wizard.order))
	const current = $derived(STEPS[wizard.stepIndex])

	/** Подложка шапке нужна, только когда под неё уехал контент. */
	let scrollY = $state(0)
	const scrolled = $derived(scrollY > 0)

	/** Строка под названием шага: что с ним сейчас, чтобы не открывать каждый. */
	function status(id: StepId) {
		const input = wizard.input
		if (id === 'upload') return loaded ? wizard.fileName : 'zip или xml'
		if (!loaded || !input || !wizard.order) return 'После загрузки'
		if (id === 'carrier')
			return wizard.carrierName || (input.carrier.inn ? `ИНН ${input.carrier.inn}` : 'Не выбран')
		if (id === 'route') {
			const from = city(input.loadingAddress ?? wizard.order.loadingAddress)
			const to = city(input.unloadingAddress ?? wizard.order.unloadingAddress)
			return from || to ? `${from || '?'} → ${to || '?'}` : 'Адреса не выбраны'
		}
		return input.orderNumber?.trim() ? `Заказ № ${input.orderNumber.trim()}` : 'Без номера заказа'
	}

	/** Город для строки маршрута; у адреса из 1С — первая часть строки. */
	const city = (address?: FiasAddress) =>
		address?.locality?.name ?? address?.municipalDistrict?.name ?? address?.text?.split(',')[0].trim() ?? ''

	/** Стрелки по вкладкам, как у обычного tablist: закрытые шаги пропускаем. */
	function onKeydown(event: KeyboardEvent) {
		const shift = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
		if (!shift) return
		event.preventDefault()
		const reachable = STEPS.filter(({ id }) => id === 'upload' || loaded)
		const index = reachable.findIndex(({ id }) => id === wizard.step)
		const target: StepId = reachable[(index + shift + reachable.length) % reachable.length].id
		wizard.goTo(target)
		document.getElementById(`tab-${target}`)?.focus()
	}
</script>

<!--
	Шаги как вкладки: переключаться можно в любом порядке, а не только вперёд. На широком
	экране они стоят столбцом слева и видны всё время, вместе со статусом каждого; на узком
	сворачиваются в ленту над формой. Кнопки «Назад/Дальше» живут в липкой шапке: стоят на
	одном месте на любом шаге и не уезжают при прокрутке длинной карточки.
-->
<svelte:window bind:scrollY />

<div class="wizard">
	<header class={['wizard__header', scrolled && 'wizard__header--stuck']}>
		<div class="container wizard__header-inner">
			<!-- Угол над шагами: заголовок шага стоит над формой, а здесь — переключатель темы. -->
			<div class="wizard__corner">
				<Logo href="/about" label="Логист — о проекте" wordmark="wide" />
				<a href="/about" class="wizard__help" aria-label="Как это работает" title="Как это работает">
					<CircleHelp size={14} />
				</a>
				<span class="wizard__spacer"></span>
				<ThemeToggle />
			</div>
			<div class="wizard__heading">
				<p class="wizard__count">Шаг {wizard.stepIndex + 1} из {STEPS.length}</p>
				<h1 class="wizard__title">{current.title}</h1>
			</div>
			<StepNav />
		</div>
	</header>

	<div class="container wizard__layout">
		<aside class="wizard__aside">
			<div
				class="wizard__steps"
				role="tablist"
				aria-orientation="vertical"
				aria-label="Шаги"
				tabindex="-1"
				onkeydown={onKeydown}
			>
				{#each STEPS as item (item.id)}
					{@const gaps = wizard.missingByStep[item.id] ?? 0}
					{@const active = item.id === wizard.step}
					<!-- Галочка про свой шаг, а не про всю заявку: на соседнем может быть пусто. -->
					{@const done = loaded && gaps === 0}
					{@const Icon = done && !active ? Check : ICONS[item.id]}
					<button
						id={`tab-${item.id}`}
						type="button"
						role="tab"
						class={['wizard__step', active && 'wizard__step--active']}
						aria-selected={active}
						aria-controls="wizard-panel"
						tabindex={active ? 0 : -1}
						disabled={item.id !== 'upload' && !loaded}
						onclick={() => wizard.goTo(item.id)}
					>
						<span
							class={[
								'wizard__badge',
								active && 'wizard__badge--active',
								!active && done && 'wizard__badge--done',
							]}
						>
							<Icon size={14} />
						</span>
						<span class="wizard__label">
							<span class="wizard__name">
								{item.title}
								{#if gaps}<span class="wizard__gaps">{gaps}</span>{/if}
							</span>
							<span class="wizard__status">{status(item.id)}</span>
						</span>
					</button>
				{/each}
			</div>
			<MissingList />
		</aside>

		<main class="wizard__main">
			<div id="wizard-panel" class="wizard__panel" role="tabpanel" aria-labelledby={`tab-${wizard.step}`}>
				<View />
			</div>
		</main>
	</div>
</div>

<style>
	.wizard {
		--header: 4.25rem;
		/* Один шаг на вертикальные отступы: от шапки до островов и между островами. */
		--space: 1rem;
		/* Шапка и тело делят одни колонки: логотип стоит над шагами, заголовок — над формой. */
		--aside: 14rem;
		--columns: var(--aside) minmax(0, 1fr);
		/* Как видимый зазор от заголовка шага до острова: граница шапки прозрачна, глаз меряет от текста. */
		--column-gap: 1.875rem;

		display: flex;
		flex: 1;
		flex-direction: column;

		&__header {
			position: sticky;
			z-index: 10;
			top: 0;
			border-bottom: 1px solid transparent;
			transition:
				background-color 0.2s,
				border-color 0.2s;

			@media (--reduced-motion) {
				transition: none;
			}

			&--stuck {
				border-bottom-color: var(--border);
				background: color-mix(in oklch, var(--canvas) 75%, transparent);
				backdrop-filter: blur(12px) saturate(1.4);
			}
		}

		&__header-inner {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto;
			gap: 0.5rem;
			align-items: center;
			height: var(--header);

			@media (--md) {
				grid-template-columns: var(--aside) minmax(0, 1fr) auto;
				gap: var(--column-gap);
			}
		}

		/* На широком экране угол над шагами, на узком — просто первая кнопка в строке. */
		/* Угол над шагами: логотип слева, тема и справка справа. На узком — подряд, впритык. */
		&__corner {
			display: flex;
			gap: 0.25rem;
			align-items: center;
		}

		&__spacer {
			flex: 1;
			min-width: 0.25rem;
		}

		/* Маленький «?» вплотную к названию: справка о самом сервисе. На телефоне место в шапке
		   нужнее шагу — туда ведёт ссылка на первом шаге. */
		&__help {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 1.5rem;
			height: 1.5rem;
			border-radius: 50%;
			color: var(--muted);
			transition:
				background-color 0.15s,
				color 0.15s;

			@media (--below-sm) {
				display: none;
			}

			@media (--reduced-motion) {
				transition: none;
			}

			&:hover {
				color: var(--fg);
				background: var(--surface);
			}

			&:focus-visible {
				outline: none;
				box-shadow: 0 0 0 3px var(--ring);
			}
		}

		&__layout {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			flex: 1;
			gap: var(--space);
			align-content: start;
			align-items: start;
			padding-block: var(--space) 0;

			@media (--md) {
				grid-template-columns: var(--columns);
				gap: var(--column-gap);
			}
		}

		&__aside {
			display: flex;
			flex-direction: column;
			gap: var(--space);

			@media (--md) {
				position: sticky;
				top: calc(var(--header) + var(--space));
			}
		}

		/* На узком — лента, которая прокручивается вбок; на широком — столбец. */
		&__steps {
			scrollbar-width: none;
			overflow-x: auto;
			display: flex;
			gap: 0.25rem;
			margin-inline: calc(var(--gutter) * -1);
			padding-inline: var(--gutter);

			@media (--md) {
				overflow: visible;
				flex-direction: column;
				margin-inline: 0;
				padding-inline: 0;
			}
		}

		&__step {
			cursor: pointer;
			position: relative;
			display: flex;
			flex: none;
			gap: 0.75rem;
			align-items: center;
			padding: 0.5rem 0.875rem 0.5rem 0.5rem;
			border: 1px solid transparent;
			border-radius: 999px;
			text-align: left;
			background: none;
			transition:
				background-color 0.15s,
				border-color 0.15s;

			@media (--reduced-motion) {
				transition: none;
			}

			@media (--md) {
				align-items: flex-start;
				padding: 0.625rem 0.75rem;
				border-radius: var(--radius);
			}

			&:hover:not(:disabled) {
				background: color-mix(in oklch, var(--fg) 4%, transparent);
			}

			&:disabled {
				cursor: default;
				opacity: 0.5;
			}

			/* Подсветка пункта меню, а не карточка: без рамки и тени, чтобы не спорить с островами формы. */
			&--active,
			&--active:hover:not(:disabled) {
				background: color-mix(in oklch, var(--fg) 7%, transparent);
			}
		}

		&__badge {
			display: flex;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			width: 1.75rem;
			height: 1.75rem;
			border: 1px solid var(--border);
			border-radius: 50%;
			color: var(--muted);
			background: var(--bg);
			transition:
				background-color 0.15s,
				color 0.15s;

			@media (--reduced-motion) {
				transition: none;
			}

			&--active {
				border-color: var(--brand);
				color: var(--brand-fg);
				background: var(--brand);
			}

			&--done {
				border-color: transparent;
				color: var(--success);
				background: var(--success-bg);
			}
		}

		&__label {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		&__name {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			font-weight: 500;
			white-space: nowrap;
		}

		&__status {
			overflow: hidden;
			display: none;
			max-width: 11rem;
			font-size: 0.75rem;
			color: var(--muted);
			text-overflow: ellipsis;
			white-space: nowrap;

			@media (--md) {
				display: block;
			}
		}

		&__gaps {
			padding: 0 0.4375rem;
			border-radius: 999px;
			font-size: 0.6875rem;
			font-weight: 600;
			font-variant-numeric: tabular-nums;
			line-height: 1.25rem;
			color: var(--warning);
			background: var(--warning-bg);

			/* В столбце то же число уже есть в строке статуса. */
			@media (--md) {
				display: none;
			}
		}

		&__main {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		&__heading {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}

		&__count {
			font-size: 0.6875rem;
			font-weight: 500;
			color: var(--brand-text);
			text-transform: uppercase;
			letter-spacing: 0.06em;
		}

		&__title {
			overflow: hidden;
			font-size: 1.25rem;
			font-weight: 650;
			line-height: 1.25;
			text-overflow: ellipsis;
			letter-spacing: -0.025em;
			white-space: nowrap;

			@media (--below-sm) {
				font-size: 1.0625rem;
			}
		}

		&__panel {
			flex: 1;
			padding-bottom: 2rem;
		}
	}
</style>
