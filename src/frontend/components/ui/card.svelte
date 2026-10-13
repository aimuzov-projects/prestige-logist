<script lang="ts">
	import type { Component, Snippet } from 'svelte'

	import InfoTip from '#frontend/components/ui/info-tip.svelte'

	type Props = {
		title?: string
		/** Иконка lucide перед заголовком: по ней блок узнаётся быстрее, чем по тексту. */
		icon?: Component<{ size?: number; class?: string }>
		/** Пояснение за значком «?» у заголовка: справка, нужная не всем. */
		info?: string
		/** Действие справа от заголовка, обычно ChipButton. */
		action?: Snippet
		children: Snippet
	}

	let { title, icon: Icon, info, action, children }: Props = $props()
</script>

<section class="card">
	{#if title}
		<h2 class="card__title">
			{#if Icon}<Icon class="card__icon" size={16} />{/if}
			<span class="card__text">{title}</span>
			{#if info}<InfoTip text={info} />{/if}
			{#if action}<span class="card__action">{@render action()}</span>{/if}
		</h2>
	{/if}
	{@render children()}
</section>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);
		box-shadow: var(--shadow-sm);

		@media (--below-sm) {
			padding: 1.125rem;
		}

		&__title {
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem;
			align-items: center;
			min-height: 1.5rem;
			font-size: 0.9375rem;
			font-weight: 600;
			letter-spacing: -0.01em;

			/* Слова не рвём: тесно — правая часть шапки уходит строкой ниже. Рвём только
			   слово длиннее строки, вроде имени файла. */
			:global(.card__text) {
				min-width: 0;
				overflow-wrap: break-word;
			}

			:global(.card__icon) {
				flex-shrink: 0;
				margin-right: 0.25rem;
				color: var(--brand-text);
			}
		}

		/* Кнопка ниже строки заголовка, поэтому высоту карточки не меняет. */
		&__action {
			gap: 0.25rem;
			align-items: center;
			align-items: center;
			margin-left: auto;
			font-size: 0.75rem;
			font-weight: 500;
			letter-spacing: normal;
		}
	}
</style>
