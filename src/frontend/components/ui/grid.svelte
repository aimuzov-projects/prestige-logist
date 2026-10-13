<script lang="ts">
	import type { Snippet } from 'svelte'

	let { columns = 2, children }: { columns?: 2 | 3; children: Snippet } = $props()
</script>

<div class={['grid', `grid--${columns}`]}>
	{@render children()}
</div>

<style>
	.grid {
		display: grid;
		gap: 1.25rem 1rem;

		@media (--sm) {
			&--2 {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}

			&--3 {
				grid-template-columns: repeat(3, minmax(0, 1fr));
			}
		}
	}
</style>
