<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down'
	import type { Snippet } from 'svelte'

	type Props = {
		/** Уникален на странице: связывает шапку с телом для читалок. */
		id: string
		title: string
		open?: boolean
		/** Внутри есть пустое обязательное — точка видна и в свёрнутом виде. */
		missing?: boolean
		children: Snippet
	}

	let { id, title, open = $bindable(false), missing = false, children }: Props = $props()
</script>

<!--
	Шапка и тело — одна рамка: так видно, что поля внутри относятся к этому заголовку,
	а шеврон и подпись справа говорят, раскрыт блок или нет.
-->
<div class={['disclosure', open && 'disclosure--open']}>
	<button
		type="button"
		class="disclosure__head"
		aria-expanded={open}
		aria-controls={id}
		onclick={() => (open = !open)}
	>
		<span class="disclosure__text">
			<span class="disclosure__title">
				{title}{#if missing}<span class="missing-mark" title="Есть незаполненное"></span>{/if}
			</span>
		</span>
		<span class="disclosure__state">{open ? 'Свернуть' : 'Развернуть'}</span>
		<ChevronDown class="disclosure__chevron" size={16} />
	</button>

	{#if open}
		<div {id} class="disclosure__body">
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.disclosure {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);

		&--open {
			border-color: var(--border-strong);
		}

		&__head {
			cursor: pointer;
			display: flex;
			gap: 0.75rem;
			align-items: center;
			width: 100%;
			padding: 0.75rem 1rem;
			border: 0;
			border-radius: calc(var(--radius) - 1px);
			text-align: left;
			background: none;
			transition: background-color 0.15s;

			@media (--reduced-motion) {
				transition: none;
			}

			&:hover {
				background: var(--surface);
			}

			&:focus-visible {
				outline: none;
				box-shadow: inset 0 0 0 2px var(--ring);
			}

			:global(.disclosure__chevron) {
				flex-shrink: 0;
				color: var(--muted);
				transition: rotate 0.15s;
			}
		}

		/* Только своя шапка: вложенный блок раскрывается сам по себе. */
		&--open > &__head {
			border-bottom: 1px solid var(--border);
			border-radius: calc(var(--radius) - 1px) calc(var(--radius) - 1px) 0 0;
			background: var(--surface);

			:global(.disclosure__chevron) {
				rotate: 180deg;
			}
		}

		&__text {
			display: flex;
			flex: 1;
			flex-direction: column;
			min-width: 0;
		}

		&__title {
			font-weight: 500;
		}

		&__state {
			font-size: 0.75rem;
			color: var(--muted);

			@media (--below-sm) {
				display: none;
			}
		}

		&__body {
			display: flex;
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
		}
	}
</style>
