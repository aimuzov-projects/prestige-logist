<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { HTMLButtonAttributes } from 'svelte/elements'

	type Props = HTMLButtonAttributes & {
		variant?: 'primary' | 'outline' | 'ghost'
		size?: 'md' | 'lg' | 'xl'
		/** Во всю ширину строки, содержимое разносится по краям. */
		wide?: boolean
		children: Snippet
	}

	let { variant = 'primary', size = 'md', wide = false, type = 'button', children, ...rest }: Props = $props()
</script>

<button {type} class={['button', `button--${variant}`, `button--${size}`, wide && 'button--wide']} {...rest}>
	{@render children()}
</button>

<style>
	.button {
		cursor: pointer;
		display: inline-flex;
		flex-shrink: 0;
		gap: 0.5rem;
		align-items: center;
		justify-content: center;
		height: 2.25rem;
		padding: 0 0.75rem;
		border: 1px solid transparent;
		border-radius: calc(var(--radius) * 0.8);
		font-weight: 500;
		white-space: nowrap;
		transition:
			background-color 0.15s,
			border-color 0.15s,
			opacity 0.15s;

		&:disabled {
			cursor: default;
			opacity: 0.5;
		}

		&--primary {
			color: var(--primary-fg);
			background: var(--primary);

			&:hover:not(:disabled) {
				background: color-mix(in oklch, var(--primary) 85%, transparent);
			}
		}

		&--outline {
			border-color: var(--border);
			background: var(--bg);

			&:hover:not(:disabled) {
				background: var(--surface);
			}
		}

		&--ghost {
			background: transparent;

			&:hover:not(:disabled) {
				background: var(--surface);
			}
		}

		&--lg {
			height: 2.5rem;
			padding: 0 1rem;
		}

		&--xl {
			height: 2.75rem;
			padding: 0 1.5rem;
		}

		&--wide {
			justify-content: space-between;
			width: 100%;
		}
	}
</style>
