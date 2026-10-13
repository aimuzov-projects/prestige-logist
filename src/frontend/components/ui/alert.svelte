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
		border: 1px solid color-mix(in oklch, var(--warning) 25%, transparent);
		border-left: 3px solid var(--warning);
		border-radius: var(--radius-sm);
		background: var(--warning-bg);

		&--danger {
			border-color: color-mix(in oklch, var(--danger) 25%, transparent);
			border-left-color: var(--danger);
			color: var(--danger);
			background: var(--danger-bg);
		}

		&__icon {
			display: flex;
			padding-top: 0.15rem;
			color: var(--warning);
		}

		&__body {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.25rem;
			min-width: 0;
		}

		&__title {
			font-weight: 600;
		}
	}
</style>
