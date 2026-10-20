<script lang="ts">
	type Props = {
		/** Куда ведёт; без него знак просто стоит, как в мастере, где о сервисе рассказывает значок в углу. */
		href?: string
		label: string
		/** Подпись рядом со знаком: всегда или только на широком экране, где хватает места. */
		wordmark?: 'always' | 'wide'
		/** Убрать из Tab: в мастере клавиатурой ходят только по полям формы. */
		skipTab?: boolean
	}

	let { href, label, wordmark = 'always', skipTab = false }: Props = $props()
</script>

<!--
	Знак — «Л» из маршрута: две остановки внизу, путь через вершину. Тот же рисунок
	в public/favicon.svg, только с цветом гвоздями: там нет переменных темы.
-->
<svelte:element
	this={href ? 'a' : 'span'}
	{href}
	class="logo"
	role={href ? undefined : 'img'}
	aria-label={label}
	tabindex={href && skipTab ? -1 : undefined}
>
	<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
		<rect width="32" height="32" rx="9" fill="currentColor" />
		<path
			d="M9 22.5 16 9.5l7 13"
			fill="none"
			stroke="var(--brand-fg)"
			stroke-width="2.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<circle cx="9" cy="22.5" r="2.75" fill="var(--brand-fg)" />
		<circle cx="23" cy="22.5" r="2.75" fill="var(--brand-fg)" />
	</svg>
	<span class={['logo__word', wordmark === 'wide' && 'logo__word--wide']}>Логист</span>
</svelte:element>

<style>
	.logo {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 1.0625rem;
		font-weight: 700;
		color: var(--fg);
		text-decoration: none;
		letter-spacing: -0.02em;

		&:focus-visible {
			border-radius: var(--radius-sm);
			outline: none;
			box-shadow: 0 0 0 3px var(--ring);
		}

		&__mark {
			flex-shrink: 0;
			width: 1.75rem;
			height: 1.75rem;
			color: var(--brand);
		}

		&__word--wide {
			@media (--below-md) {
				display: none;
			}
		}
	}
</style>
