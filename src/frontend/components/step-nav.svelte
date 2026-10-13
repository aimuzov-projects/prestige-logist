<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left'
	import ArrowRight from '@lucide/svelte/icons/arrow-right'
	import Download from '@lucide/svelte/icons/download'
	import LoaderCircle from '@lucide/svelte/icons/loader-circle'

	import Button from '#frontend/components/ui/button.svelte'
	import { STEPS, wizard } from '#frontend/lib/wizard.svelte.ts'

	const loaded = $derived(Boolean(wizard.order))
	const canGoBack = $derived(wizard.stepIndex > 0)
	const last = $derived(wizard.stepIndex === STEPS.length - 1)
</script>

<!--
	Лишнюю кнопку не показываем вовсе, а не гасим: с первого шага назад некуда, а пока
	поручение не разобрано — некуда и вперёд. С последнего шага идти тоже некуда:
	там вместо «Дальше» стоит выгрузка XML, ради которой всё и затевалось.
-->
{#if canGoBack || loaded}
	<nav class="step-nav">
		{#if canGoBack}
			<Button variant="ghost" size="lg" aria-label="Назад" onclick={wizard.back}>
				<ArrowLeft size={16} />
				<span class="step-nav__label">Назад</span>
			</Button>
		{/if}
		{#if loaded}
			{#if last}
				<Button size="lg" aria-label="Скачать" disabled={!wizard.canDownload} onclick={wizard.download}>
					{#if wizard.building}
						<LoaderCircle class="spin" size={16} />
					{:else}
						<Download size={16} />
					{/if}
					<span class="step-nav__label">Скачать</span>
				</Button>
			{:else}
				<Button size="lg" aria-label="Дальше" onclick={wizard.next}>
					<span class="step-nav__label">Дальше</span>
					<ArrowRight size={16} />
				</Button>
			{/if}
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
