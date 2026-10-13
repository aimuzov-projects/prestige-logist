<script lang="ts">
	import type { Snippet } from 'svelte'

	import InfoTip from '#frontend/components/ui/info-tip.svelte'

	type Props = {
		label: string
		/** id поля ввода: по клику на подпись фокус уходит в него. */
		for?: string
		/** Пояснение за значком «?» у подписи. */
		hint?: string
		/** Сколько колонок сетки `Grid` занимает поле. */
		span?: 2 | 3
		/** Обязательное поле пустое — у подписи появляется точка. */
		missing?: boolean
		children: Snippet
	}

	let { label, for: id, hint, span, missing = false, children }: Props = $props()
</script>

<div class={['field', span && `field--span-${span}`]}>
	<!-- Значок вне label: иначе щелчок по нему уводил бы фокус в поле. -->
	<div class="field__head">
		<label class="field__label" for={id}>
			{label}{#if missing}<span class="missing-mark" title="Не заполнено"></span>{/if}
		</label>
		{#if hint}<InfoTip text={hint} />{/if}
	</div>
	{@render children()}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;

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

		&__head {
			display: flex;
			gap: 0.25rem;
			align-items: center;
		}

		&__label {
			font-size: 0.8125rem;
			font-weight: 500;
		}
	}
</style>
