<script lang="ts">
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert'

	let { message }: { message: string } = $props()
</script>

<!--
	Контейнер с aria-live есть всегда, меняется только текст: так читалка объявляет
	каждое новое сообщение, а не только первое.
-->
<div class="toast" role="status" aria-live="polite">
	{#if message}
		<p class="toast__body">
			<TriangleAlert class="toast__icon" size={16} />
			{message}
		</p>
	{/if}
</div>

<style>
	.toast {
		pointer-events: none;
		position: fixed;
		z-index: 30;
		right: 0;
		bottom: 1.5rem;
		left: 0;
		display: flex;
		justify-content: center;
		padding-inline: var(--gutter);

		&__body {
			display: flex;
			gap: 0.625rem;
			align-items: flex-start;
			max-width: 32rem;
			padding: 0.75rem 1rem;
			border: 1px solid color-mix(in oklch, var(--warning) 30%, var(--warning-bg));
			border-radius: var(--radius);
			color: var(--fg);
			background: var(--warning-bg);
			box-shadow: var(--shadow-md);
			animation: toast-in 0.2s ease-out;

			@media (--reduced-motion) {
				animation: none;
			}

			:global(.toast__icon) {
				flex-shrink: 0;
				margin-top: 0.15rem;
				color: var(--warning);
			}
		}
	}

	@keyframes toast-in {
		from {
			translate: 0 0.5rem;
			opacity: 0;
		}
	}
</style>
