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
		<ChipButton aria-expanded={open} aria-controls={id} onclick={() => (open = !open)}>
			{#if open}
				<ChevronUp size={14} />
				Свернуть
			{:else}
				<Pencil size={14} />
				Изменить
			{/if}
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
		background: var(--brand-soft);
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
				background: color-mix(in oklch, var(--brand-text) 8%, transparent);
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
				background: color-mix(in oklch, var(--fg) 6%, var(--surface));
			}
		}

		&__icon {
			display: flex;
			flex-shrink: 0;
			align-items: center;
			height: 1.5rem;
			color: var(--brand-text);
		}

		&--warning &__icon {
			color: var(--warning);
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

		&__body {
			display: flex;
			flex-direction: column;
			gap: 1rem;
			padding: 0.75rem;
		}
	}
</style>
