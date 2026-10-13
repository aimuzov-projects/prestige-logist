<script lang="ts">
	import FileCheck from '@lucide/svelte/icons/file-check-corner'
	import FolderOpen from '@lucide/svelte/icons/folder-open'
	import Sparkles from '@lucide/svelte/icons/sparkles'
	import Upload from '@lucide/svelte/icons/upload'

	import type { OrderSummary } from '#shared/request.ts'
	import Alert from '#frontend/components/ui/alert.svelte'
	import Button from '#frontend/components/ui/button.svelte'
	import Card from '#frontend/components/ui/card.svelte'
	import ChipButton from '#frontend/components/ui/chip-button.svelte'
	import Skeleton from '#frontend/components/ui/skeleton.svelte'
	import { wizard } from '#frontend/lib/wizard.svelte.ts'

	const SUMMARY_LABELS: Array<[keyof OrderSummary, string]> = [
		['number', 'Поручение №'],
		['date', 'Дата'],
		['client', 'Клиент'],
		['forwarder', 'Экспедитор'],
		['consignor', 'Грузоотправитель'],
		['cargo', 'Груз'],
		['packageCount', 'Мест'],
		['grossWeight', 'Вес брутто, кг'],
		['bodyType', 'Кузов'],
		['shipment', 'Отгрузка'],
		['delivery', 'Доставка'],
		['from', 'Погрузка'],
		['to', 'Выгрузка'],
	]

	let dragging = $state(false)
	let picker: HTMLInputElement

	const take = (file?: File | null) => {
		if (file) wizard.analyze(file)
	}

	/** Пример лежит рядом со статикой: посетитель видит форму в деле, не ища своего комплекта. */
	const DEMO = '/demo/poruchenie-primer.zip'

	async function tryDemo() {
		const response = await fetch(DEMO)
		if (!response.ok) {
			wizard.analyzeError = `Пример не загрузился: ${response.status}`
			return
		}
		take(new File([await response.blob()], DEMO.split('/').pop() ?? ''))
	}
</script>

<!-- Выбор файла один на оба состояния: дропзона исчезает, а «Заменить» пользуется им же. -->
<input
	bind:this={picker}
	type="file"
	accept=".zip,.xml"
	hidden
	onchange={(event) => {
		take(event.currentTarget.files?.[0])
		event.currentTarget.value = ''
	}}
/>

<div class="upload">
	<!-- Разобранное поручение занимает место дропзоны: загружать второй раз незачем,
	     а понадобится — рядом со сводкой есть «Заменить». Пока сервер разбирает файл,
	     на этом месте заготовка той же сводки. -->
	{#if wizard.analyzing}
		<div role="status" aria-label="Разбираем комплект">
			<Card>
				<div class="upload__skeleton-head">
					<Skeleton width="1rem" height="1rem" />
					<Skeleton width="12rem" height="1rem" />
				</div>
				<div class="upload__summary">
					{#each SUMMARY_LABELS as [key], index (key)}
						<Skeleton width="7rem" />
						<Skeleton width={`${[60, 35, 70, 75, 65, 30, 15, 20, 40, 50, 50, 80, 55][index] ?? 50}%`} />
					{/each}
				</div>
			</Card>
		</div>
	{:else if !wizard.summary}
		<div
			class={['upload__drop', dragging && 'upload__drop--over']}
			role="button"
			tabindex="0"
			aria-label="Загрузить комплект поручения"
			onclick={() => picker.click()}
			onkeydown={(event) => (event.key === 'Enter' || event.key === ' ') && picker.click()}
			ondragover={(event) => {
				event.preventDefault()
				dragging = true
			}}
			ondragleave={() => (dragging = false)}
			ondrop={(event) => {
				event.preventDefault()
				dragging = false
				take(event.dataTransfer?.files[0])
			}}
		>
			<span class="upload__icon"><Upload size={22} /></span>
			<p class="upload__title">
				{wizard.analyzing ? 'Разбираем комплект…' : 'Перетащите сюда комплект поручения'}
			</p>
			<p class="upload__note">zip «полного документооборота» или отдельный ON_POREXPKLT_*.xml</p>
			<span class="upload__button">
				<FolderOpen size={18} />
				Выбрать файл
			</span>
		</div>

		<div class="upload__demo">
			<p class="upload__demo-text">
				<span class="upload__demo-title">Нет комплекта под рукой?</span>
				Откройте пример — синтетическое поручение, на нём видно все шаги. Или
				<a class="upload__demo-link" href={DEMO} download>скачайте архив</a>, чтобы загрузить его сами.
				<a class="upload__demo-link" href="/about">Как это работает</a>
			</p>
			<Button variant="outline" size="lg" disabled={wizard.analyzing} onclick={tryDemo}>
				<Sparkles size={16} />
				Открыть пример
			</Button>
		</div>
	{/if}

	{#if wizard.analyzeError}
		<Alert variant="danger">{wizard.analyzeError}</Alert>
	{/if}

	{#if wizard.summary && !wizard.analyzing}
		{@const summary = wizard.summary}
		<Card title={wizard.fileName} icon={FileCheck}>
			{#snippet action()}
				<ChipButton disabled={wizard.analyzing} onclick={() => picker.click()}>
					<FolderOpen size={14} />
					Заменить
				</ChipButton>
			{/snippet}
			<dl class="upload__summary">
				{#each SUMMARY_LABELS as [key, label] (key)}
					<dt class="upload__term">{label}</dt>
					<dd>{summary[key] || '—'}</dd>
				{/each}
			</dl>
		</Card>
	{/if}
</div>

<style>
	.upload {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__drop {
			cursor: pointer;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			align-items: center;
			justify-content: center;
			min-height: 20rem;
			padding: 3.5rem 1.5rem;
			border: 1.5px dashed var(--border-strong);
			border-radius: var(--radius);
			text-align: center;
			background: var(--bg);
			transition:
				background-color 0.15s,
				border-color 0.15s;

			@media (--reduced-motion) {
				transition: none;
			}

			&:hover,
			&--over {
				border-color: color-mix(in srgb, var(--selected-text) 45%, transparent);
				background: var(--hover-bg);
			}

			&:focus-visible {
				border-color: var(--brand);
				outline: none;
				box-shadow: 0 0 0 3px var(--ring);
			}
		}

		&__icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 3.5rem;
			height: 3.5rem;
			margin-bottom: 0.75rem;
			border-radius: var(--radius);
			color: var(--brand-text);
			background: var(--brand-soft);
		}

		&__title {
			font-size: 1rem;
			font-weight: 500;
		}

		&__note {
			color: var(--muted);
		}

		/* Не кнопка, а её вид: щелчок по всей зоне делает то же самое. */
		&__button {
			display: inline-flex;
			gap: 0.5rem;
			align-items: center;
			height: 2.75rem;
			margin-top: 1.25rem;
			padding: 0 1.5rem;
			border-radius: var(--radius-sm);
			font-weight: 500;
			color: var(--primary-fg);
			background: var(--primary);
		}

		&__drop:hover &__button {
			background: color-mix(in srgb, var(--primary) 88%, black);
		}

		&__demo {
			display: flex;
			gap: 1rem;
			align-items: center;
			justify-content: space-between;
			padding: 1rem 1.25rem;
			border: 1px solid var(--border);
			border-radius: var(--radius);
			background: var(--bg);
			box-shadow: var(--shadow-sm);

			@media (--below-sm) {
				flex-direction: column;
				align-items: stretch;
			}
		}

		&__demo-text {
			color: var(--muted);
		}

		&__demo-title {
			display: block;
			font-weight: 500;
			color: var(--fg);
		}

		&__demo-link {
			color: var(--accent);
			text-underline-offset: 2px;
		}

		&__summary {
			display: grid;
			gap: 0.625rem 2rem;

			@media (--sm) {
				grid-template-columns: max-content 1fr;
			}
		}

		&__term {
			color: var(--muted);
		}

		/* Заготовка шапки сводки: иконка и имя файла, ростом как заголовок карточки. */
		&__skeleton-head {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			height: 1.5rem;
		}
	}
</style>
