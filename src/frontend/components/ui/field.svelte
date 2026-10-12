<script lang="ts">
	import type { Snippet } from 'svelte'

	type Props = {
		label: string
		/** id поля ввода: по клику на подпись фокус уходит в него. */
		for?: string
		hint?: string
		/** Сколько колонок сетки `Grid` занимает поле. */
		span?: 2 | 3
		children: Snippet
	}

	let { label, for: id, hint, span, children }: Props = $props()
</script>

<div class={['field', span && `field--span-${span}`]}>
	<label class="field__label" for={id}>{label}</label>
	{@render children()}
	{#if hint}
		<p class="hint">{hint}</p>
	{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		/* На узком экране сетка в одну колонку, растягивать поле некуда. */
		&--span-2 {
			@media (--sm) {
				grid-column: span 2;
			}
		}

		&--span-3 {
			@media (--sm) {
				grid-column: span 3;
			}
		}

		&__label {
			font-weight: 500;
		}
	}
</style>
