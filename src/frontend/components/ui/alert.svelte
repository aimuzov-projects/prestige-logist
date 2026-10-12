<script lang="ts">
	import type { Snippet } from 'svelte'

	type Props = {
		variant?: 'default' | 'danger'
		title?: string
		icon?: Snippet
		children: Snippet
	}

	let { variant = 'default', title, icon, children }: Props = $props()
</script>

<div class={['alert', `alert--${variant}`]} role={variant === 'danger' ? 'alert' : undefined}>
	{#if icon}
		<span class="alert__icon">{@render icon()}</span>
	{/if}
	<div class="alert__body">
		{#if title}
			<p class="alert__title">{title}</p>
		{/if}
		{@render children()}
	</div>
</div>

<style>
	.alert {
		display: flex;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--bg);

		&--danger {
			border-color: color-mix(in oklch, var(--danger) 30%, transparent);
			color: var(--danger);
			background: var(--danger-bg);
		}

		&__icon {
			display: flex;
			padding-top: 0.15rem;
		}

		&__body {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.25rem;
			min-width: 0;
		}

		&__title {
			font-weight: 500;
		}
	}
</style>
