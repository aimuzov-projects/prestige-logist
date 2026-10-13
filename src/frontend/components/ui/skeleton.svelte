<script lang="ts">
	type Props = {
		/** Любая длина CSS: заготовка строки обычно короче настоящего текста. */
		width?: string
		height?: string
		/** Кружок вместо полоски — под иконку или бейдж шага. */
		round?: boolean
	}

	let { width = '100%', height = '0.875rem', round = false }: Props = $props()
</script>

<!-- Заготовка на месте данных, которые ещё едут с сервера. Для читалок молчит: ожидание объявляет роль status у контейнера. -->
<span class={['skeleton', round && 'skeleton--round']} style:width style:height aria-hidden="true"></span>

<style>
	.skeleton {
		display: block;
		flex-shrink: 0;
		border-radius: 0.375rem;
		background: color-mix(in srgb, var(--fg) 8%, transparent);
		animation: pulse 1.4s ease-in-out infinite;

		@media (--reduced-motion) {
			animation: none;
		}

		&--round {
			border-radius: 50%;
		}
	}

	@keyframes pulse {
		50% {
			opacity: 0.45;
		}
	}
</style>
