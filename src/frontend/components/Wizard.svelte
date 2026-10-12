<script lang="ts">
	import Check from '@lucide/svelte/icons/check'
	import ClipboardList from '@lucide/svelte/icons/clipboard-list'
	import FileInput from '@lucide/svelte/icons/file-input'
	import RouteIcon from '@lucide/svelte/icons/route'
	import Truck from '@lucide/svelte/icons/truck'

	import StepNav from '#frontend/components/StepNav.svelte'
	import CarrierStep from '#frontend/components/steps/CarrierStep.svelte'
	import RequestStep from '#frontend/components/steps/RequestStep.svelte'
	import RouteStep from '#frontend/components/steps/RouteStep.svelte'
	import UploadStep from '#frontend/components/steps/UploadStep.svelte'
	import { STEPS, wizard, type StepId } from '#frontend/lib/wizard.svelte.ts'

	const VIEWS = { upload: UploadStep, carrier: CarrierStep, route: RouteStep, request: RequestStep }

	/** Иконка вместо порядкового номера: по ней шаг узнаётся быстрее, чем по цифре. */
	const ICONS = { upload: FileInput, carrier: Truck, route: RouteIcon, request: ClipboardList }

	wizard.connect()

	const View = $derived(VIEWS[wizard.step])
	const loaded = $derived(Boolean(wizard.order))

	/** Стрелки по вкладкам, как у обычного tablist: закрытые шаги пропускаем. */
	function onKeydown(event: KeyboardEvent) {
		const shift = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
		if (!shift) return
		const reachable = STEPS.filter(({ id }) => id === 'upload' || loaded)
		const index = reachable.findIndex(({ id }) => id === wizard.step)
		const target: StepId = reachable[(index + shift + reachable.length) % reachable.length].id
		wizard.goTo(target)
		document.getElementById(`tab-${target}`)?.focus()
	}
</script>

<!--
	Шаги как вкладки: переключаться можно в любом порядке, а не только вперёд. Страница
	разрезана надвое: сверху полоса с заголовком и вкладками, снизу белое поле формы.
	Активная вкладка тоже белая и подрезает границу под собой, поэтому читается как
	продолжение поля, а не как отдельная кнопка.
-->
<div class="wizard">
	<header class="wizard__band">
		<div class="container">
			<div class="wizard__heading">
				<p class="wizard__kicker">КНД 1110486 → КНД 1110361 · формат ФНС 5.01</p>
				<h1 class="wizard__title">Поручение экспедитору → заявка перевозчику</h1>
			</div>

			<div class="wizard__tabs" role="tablist" tabindex="-1" onkeydown={onKeydown}>
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
						class={['wizard__tab', active && 'wizard__tab--active']}
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
						{item.title}
						{#if gaps}<span class="wizard__gaps">{gaps}</span>{/if}
					</button>
				{/each}
			</div>
		</div>
	</header>

	<main class="wizard__field">
		<div class="container">
			<div class="wizard__body">
				<!-- Навигация одна на все шаги и стоит над формой: до неё не надо прокручивать
				     длинную карточку. -->
				<StepNav />
				<div id="wizard-panel" role="tabpanel" aria-labelledby={`tab-${wizard.step}`}>
					<View />
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	/*
	 * Вкладки одной ширины, с запасом под самую длинную подпись со счётчиком.
	 * Поле формы кончается там же, где последняя вкладка.
	 */
	.wizard {
		--tab: 10.25rem;
		--tab-gap: 0.25rem;
		--row: calc(var(--tab) * 4 + var(--tab-gap) * 3);

		display: flex;
		flex: 1;
		flex-direction: column;

		&__band {
			border-bottom: 1px solid var(--border);
			background: var(--header);
		}

		&__heading {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
			padding: 2.5rem 0 0 1.5rem;
		}

		&__kicker {
			font-size: 0.75rem;
			font-weight: 500;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.025em;
		}

		&__title {
			font-size: 1.5rem;
			font-weight: 600;
			line-height: 1.3;
			letter-spacing: -0.015em;
		}

		/* Сдвиг на границу полосы — у обёртки: внутри прокрутки он включал бы вертикальную полосу. */
		&__tabs {
			overflow-x: auto;
			display: flex;
			gap: var(--tab-gap);
			width: var(--row);
			max-width: 100%;
			margin: 2rem 0 -1px;
		}

		&__tab {
			cursor: pointer;
			display: inline-flex;
			flex: none;
			gap: 0.5rem;
			align-items: center;
			width: var(--tab);
			height: 2.75rem;
			padding: 0 0.75rem;
			border: 1px solid transparent;
			border-radius: var(--radius) var(--radius) 0 0;
			font-weight: 500;
			color: color-mix(in oklch, var(--fg) 60%, transparent);
			white-space: nowrap;
			background: none;

			&:hover:not(:disabled) {
				color: var(--fg);
			}

			&:disabled {
				cursor: default;
				opacity: 0.5;
			}

			&--active {
				border-color: var(--border);
				border-bottom-color: var(--bg);
				color: var(--fg);
				background: var(--bg);
			}
		}

		&__badge {
			display: flex;
			flex-shrink: 0;
			align-items: center;
			justify-content: center;
			width: 1.5rem;
			height: 1.5rem;
			border: 1px solid var(--border);
			border-radius: 50%;
			color: var(--muted);
			background: var(--bg);

			&--active {
				border-color: var(--fg);
				color: var(--bg);
				background: var(--fg);
			}

			&--done {
				border-color: transparent;
				color: var(--success);
				background: var(--success-bg);
			}
		}

		&__gaps {
			padding: 0 0.375rem;
			border-radius: 999px;
			font-size: 0.6875rem;
			font-weight: 600;
			font-variant-numeric: tabular-nums;
			color: var(--warning);
			background: var(--warning-bg);
		}

		&__field {
			flex: 1;
			background: var(--bg);
		}

		&__body {
			width: var(--row);
			max-width: 100%;
			padding-block: 2rem;
		}
	}
</style>
