<script lang="ts">
	import Check from '@lucide/svelte/icons/check'
	import Copy from '@lucide/svelte/icons/copy'

	/** label — что это за номер: попадает в подсказку и в озвучку кнопки. */
	let { label, value }: { label: string; value: string } = $props()

	let copied = $state(false)
	let timer: ReturnType<typeof setTimeout> | undefined

	async function copy() {
		try {
			await navigator.clipboard.writeText(value)
		} catch {
			// Буфер закрыт (не https или запрет браузера) — галочку не показываем, номер виден и так.
			return
		}
		copied = true
		clearTimeout(timer)
		timer = setTimeout(() => (copied = false), 1500)
	}
</script>

<!-- Реквизиты переписывают в другие системы руками — копировать проще, чем перепечатывать. -->
<span class="copy">
	<span class="copy__label">{label}</span>
	<button
		tabindex="-1"
		type="button"
		class={['copy__button', copied && 'copy__button--done']}
		title={copied ? 'Скопировано' : `Скопировать ${label}`}
		aria-label={`Скопировать ${label} ${value}`}
		onclick={copy}
	>
		<span class="copy__value">{value}</span>
		{#if copied}<Check size={12} />{:else}<Copy size={12} />{/if}
	</button>
	<span class="copy__status" role="status">{copied ? 'Скопировано' : ''}</span>
</span>

<style>
	.copy {
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;
		white-space: nowrap;

		&__label {
			color: var(--muted);
		}

		/* Подложка — полупрозрачный цвет текста: ложится на любую плашку, не споря с её тоном. */
		&__button {
			cursor: pointer;
			display: inline-flex;
			gap: 0.3125rem;
			align-items: center;
			padding: 0.0625rem 0.375rem;
			border: 1px solid color-mix(in oklch, var(--fg) 10%, transparent);
			border-radius: 0.375rem;
			font-size: inherit;
			color: var(--fg);
			background: color-mix(in oklch, var(--fg) 6%, transparent);
			transition:
				background-color 0.15s,
				border-color 0.15s,
				color 0.15s;

			@media (--reduced-motion) {
				transition: none;
			}

			&:hover {
				border-color: var(--hover-border);
				color: var(--selected-text);
				background: var(--hover-bg);
			}

			&--done,
			&--done:hover {
				border-color: color-mix(in oklch, var(--success) 35%, transparent);
				color: var(--success);
				background: color-mix(in oklch, var(--success) 14%, transparent);
			}
		}

		&__value {
			font-family: var(--font-mono);
			font-variant-numeric: tabular-nums;
		}

		/* Только для читалок: объявляет, что номер скопирован. */
		&__status {
			position: absolute;
			overflow: hidden;
			width: 1px;
			height: 1px;
			white-space: nowrap;
			clip-path: inset(50%);
		}
	}
</style>
