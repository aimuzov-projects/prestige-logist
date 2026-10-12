<script lang="ts">
	import type { Snippet } from 'svelte'

	let { title, children }: { title?: string; children: Snippet } = $props()
</script>

<section class="card">
	{#if title}
		<h2 class="card__title">{title}</h2>
	{/if}
	{@render children()}
</section>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) * 1.4);
		background: var(--bg);
		box-shadow: 0 1px 2px oklch(0% 0 0 / 5%);

		&__title {
			font-size: 1rem;
			font-weight: 600;
		}
	}
</style>
