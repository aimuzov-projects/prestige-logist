<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLButtonAttributes } from 'svelte/elements'

	let { type = 'button', children, ...rest }: HTMLButtonAttributes & { children: Snippet } = $props()
</script>

<!--
	Маленькая кнопка рядом с итогом: «Изменить», «Заменить». Подложка — полупрозрачный цвет
	текста, как у копируемых номеров, поэтому ложится и на белую карточку, и на плашку.
-->
<button {type} class="chip" {...rest}>
	{@render children()}
</button>

<style>
	.chip {
		cursor: pointer;
		display: inline-flex;
		flex-shrink: 0;
		gap: 0.3125rem;
		align-items: center;
		height: 1.5rem;
		padding: 0 0.5rem;
		border: 1px solid color-mix(in oklch, var(--fg) 10%, transparent);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--fg);
		background: color-mix(in oklch, var(--fg) 6%, transparent);
		transition:
			background-color 0.15s,
			border-color 0.15s,
			color 0.15s;

		@media (--reduced-motion) {
			transition: none;
		}

		&:hover:not(:disabled) {
			border-color: color-mix(in oklch, var(--brand-text) 35%, transparent);
			color: var(--brand-text);
			background: color-mix(in oklch, var(--brand-text) 12%, transparent);
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 3px var(--ring);
		}

		&:disabled {
			cursor: default;
			opacity: 0.5;
		}
	}
</style>
