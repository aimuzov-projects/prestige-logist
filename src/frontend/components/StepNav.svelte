<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left'
	import ArrowRight from '@lucide/svelte/icons/arrow-right'
	import Download from '@lucide/svelte/icons/download'
	import LoaderCircle from '@lucide/svelte/icons/loader-circle'

	import Button from '#frontend/components/ui/Button.svelte'
	import { STEPS, wizard } from '#frontend/lib/wizard.svelte.ts'

	/**
	 * Файл отдаём ровно теми байтами, что собрал сервер: windows-1251, иначе Логистика
	 * его не прочтёт. Пересобирать в браузере нечего — base64 уже пришёл готовым.
	 */
	function download() {
		const bytes = Uint8Array.from(atob(wizard.request.file), (char) => char.charCodeAt(0))
		const url = URL.createObjectURL(new Blob([bytes], { type: 'application/xml' }))
		Object.assign(document.createElement('a'), { href: url, download: wizard.downloadName }).click()
		URL.revokeObjectURL(url)
	}

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
			<Button variant="ghost" size="xl" onclick={wizard.back}>
				<ArrowLeft size={16} />
				Назад
			</Button>
		{/if}
		{#if loaded}
			<span class="step-nav__forward">
				{#if last}
					<Button
						size="xl"
						disabled={!wizard.isComplete || wizard.building || !wizard.request.file}
						onclick={download}
					>
						{#if wizard.building}
							<LoaderCircle class="spin" size={16} />
						{:else}
							<Download size={16} />
						{/if}
						Скачать XML
					</Button>
				{:else}
					<Button size="xl" onclick={wizard.next}>
						Дальше
						<ArrowRight size={16} />
					</Button>
				{/if}
			</span>
		{/if}
	</nav>
{/if}

<style>
	.step-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;

		&__forward {
			margin-left: auto;
		}
	}
</style>
