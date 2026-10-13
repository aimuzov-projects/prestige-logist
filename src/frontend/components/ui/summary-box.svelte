<script lang="ts">
	import ChevronUp from '@lucide/svelte/icons/chevron-up'
	import Pencil from '@lucide/svelte/icons/pencil'
	import type { Snippet } from 'svelte'

	import ChipButton from '#frontend/components/ui/chip-button.svelte'

	type Props = {
		/** Уникален на странице: связывает кнопку с телом для читалок. */
		id: string
		open?: boolean
		/** Итог неполный — плашка жёлтая, а не голубая. */
		warning?: boolean
		icon: Snippet
		/** Что выбрано: строка-итог в шапке. */
		summary: Snippet
		/** Чем это поправить: раскрывается под шапкой. */
		children: Snippet
	}

	let { id, open = $bindable(false), warning = false, icon, summary, children }: Props = $props()

	/**
	 * Щелчок по любому месту шапки сворачивает и разворачивает блок. Свои кнопки внутри
	 * (сама «Изменить», копирование номеров) делают своё и сюда не доходят.
	 */
	function onHeadClick(event: MouseEvent) {
		if ((event.target as Element).closest('button, a, input')) return
		open = !open
	}
</script>

<!--
	Выбранное и его правка — один блок. Свёрнутым он тонированная плашка-итог, раскрытым —
	рамка с нейтральной шапкой, как у Disclosure, и полями под ней.
-->
<div class={['summary', open && 'summary--open', warning && !open && 'summary--warning']}>
	<!-- С клавиатуры то же делает кнопка «Изменить», поэтому у шапки своей роли нет. -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="summary__head" onclick={onHeadClick}>
		<span class="summary__icon">{@render icon()}</span>
		<div class="summary__content">{@render summary()}</div>
		<ChipButton
			aria-expanded={open}
			aria-controls={id}
			aria-label={open ? 'Свернуть' : 'Изменить'}
			onclick={() => (open = !open)}
		>
			<!-- Обе подписи в одной ячейке, видна одна: ширина кнопки — по длинной, и она не прыгает. -->
			<span class="summary__toggle">
				<span class={['summary__state', open && 'summary__state--hidden']}>
					<Pencil size={14} />
					Изменить
				</span>
				<span class={['summary__state', !open && 'summary__state--hidden']}>
					<ChevronUp size={14} />
					Свернуть
				</span>
			</span>
		</ChipButton>
	</div>
	{#if open}
		<div {id} class="summary__body">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.summary {
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		background: var(--selected-soft);
		transition:
			background-color 0.15s,
			border-color 0.15s;

		@media (--reduced-motion) {
			transition: none;
		}

		&--warning {
			background: var(--warning-bg);
		}

		&--open {
			border-color: var(--border-strong);
			background: var(--bg);
		}

		/* Строка не ниже кнопки: значок и итог встают по её центру, длинный итог растёт вниз. */
		&__head {
			cursor: pointer;
			display: flex;
			gap: 0.75rem;
			align-items: flex-start;
			padding: 0.4375rem 0.4375rem 0.4375rem 1rem;
			border-radius: calc(var(--radius-sm) - 1px);
			transition: background-color 0.15s;

			@media (--reduced-motion) {
				transition: none;
			}

			&:hover {
				background: var(--hover-bg);
			}
		}

		&--warning > &__head:hover {
			background: color-mix(in oklch, var(--warning) 10%, transparent);
		}

		&--open > &__head {
			border-bottom: 1px solid var(--border);
			border-radius: calc(var(--radius-sm) - 1px) calc(var(--radius-sm) - 1px) 0 0;
			background: var(--surface);

			&:hover {
				background: color-mix(in srgb, var(--fg) 6%, var(--surface));
			}
		}

		&__icon {
			display: flex;
			flex-shrink: 0;
			align-items: center;
			height: 1.5rem;
			color: var(--selected-text);
		}

		&--warning &__icon {
			color: var(--warning);
		}

		/* Раскрытая шапка нейтральная — и значок в ней серый, а не цвета «выбрано». */
		&--open > &__head &__icon {
			color: var(--muted);
		}

		&__content {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.25rem;
			justify-content: center;
			min-width: 0;
			min-height: 1.5rem;
			overflow-wrap: anywhere;
		}

		/*
		 * Раскрытым шапка — одна строка: итог меняется от правок под ней, и его высота
		 * не должна двигать поля, которые сейчас заполняют.
		 */
		&--open &__content > :global(:not(:first-child)) {
			display: none;
		}

		&--open &__content > :global(:first-child) {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__toggle {
			display: inline-grid;
		}

		&__state {
			display: inline-flex;
			grid-area: 1 / 1;
			gap: 0.3125rem;
			align-items: center;
			justify-content: center;

			&--hidden {
				visibility: hidden;
			}
		}

		&__body {
			display: flex;
			flex-direction: column;
			gap: 1rem;
			padding: 0.75rem;
		}
	}
</style>
