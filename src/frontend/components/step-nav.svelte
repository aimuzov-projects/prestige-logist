<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left'
	import ArrowRight from '@lucide/svelte/icons/arrow-right'

	import Button from '#frontend/components/ui/button.svelte'
	import { STEPS, wizard } from '#frontend/lib/wizard.svelte.ts'

	const loaded = $derived(Boolean(wizard.order))
	const canGoBack = $derived(wizard.stepIndex > 0)
	const last = $derived(wizard.stepIndex === STEPS.length - 1)
</script>

<!--
	«Назад» на первом разделе не показываем: идти некуда. «Дальше» стоит всегда, на последнем
	разделе гаснет — кнопка не меняет смысл и не прыгает. Скачивание живёт внизу формы.
	Из Tab навигация выключена: клавиатурой форму заполняют по полям, а не по разделам.
-->
{#if canGoBack || loaded}
	<nav class="step-nav">
		{#if canGoBack}
			<Button variant="ghost" size="lg" aria-label="Назад" tabindex={-1} onclick={wizard.back}>
				<ArrowLeft size={16} />
				<span class="step-nav__label">Назад</span>
			</Button>
		{/if}
		{#if loaded}
			<Button size="lg" aria-label="Дальше" tabindex={-1} disabled={last} onclick={wizard.next}>
				<span class="step-nav__label">Дальше</span>
				<ArrowRight size={16} />
			</Button>
		{/if}
	</nav>
{/if}

<style>
	.step-nav {
		display: flex;
		gap: 0.5rem;
		align-items: center;

		/* На телефоне в шапке тесно: у кнопок остаются одни иконки, подписи — в aria-label. */
		&__label {
			@media (--below-sm) {
				display: none;
			}
		}
	}
</style>
