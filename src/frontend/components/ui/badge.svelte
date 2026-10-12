<script lang="ts">
	import type { Snippet } from 'svelte'

	let { mono = false, children }: { mono?: boolean; children: Snippet } = $props()
</script>

<span class={['badge', mono && 'badge--mono']}>{@render children()}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		margin-left: 0.5rem;
		padding: 0 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 500;
		background: var(--surface);

		&--mono {
			margin-left: 0;
			font-family: var(--font-mono);
			font-size: 0.7rem;
		}
	}
</style>
