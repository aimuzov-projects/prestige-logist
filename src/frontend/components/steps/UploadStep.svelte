<script lang="ts">
	import FileCheck from '@lucide/svelte/icons/file-check-corner'
	import FolderOpen from '@lucide/svelte/icons/folder-open'
	import Upload from '@lucide/svelte/icons/upload'

	import type { OrderSummary } from '#/core/prefill.ts'
	import Alert from '#/frontend/components/ui/Alert.svelte'
	import Button from '#/frontend/components/ui/Button.svelte'
	import Card from '#/frontend/components/ui/Card.svelte'
	import { wizard } from '#/frontend/lib/wizard.svelte.ts'

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
	     а понадобится — рядом со сводкой есть «Заменить». -->
	{#if !wizard.summary}
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
			<Upload class="upload__icon" size={36} />
			<p class="upload__title">
				{wizard.analyzing ? 'Разбираем комплект…' : 'Перетащите сюда комплект поручения'}
			</p>
			<p class="upload__note">zip «полного документооборота» или отдельный ON_POREXPKLT_*.xml</p>
			<span class="upload__button">
				<FolderOpen size={20} />
				Выбрать файл
			</span>
		</div>
	{/if}

	{#if wizard.analyzeError}
		<Alert variant="danger">{wizard.analyzeError}</Alert>
	{/if}

	{#if wizard.summary}
		{@const summary = wizard.summary}
		<Card>
			<div class="upload__file">
				<p class="upload__name">
					<FileCheck class="upload__ok" size={16} />
					{wizard.fileName}
				</p>
				<Button variant="ghost" size="lg" disabled={wizard.analyzing} onclick={() => picker.click()}>
					<FolderOpen size={16} />
					Заменить
				</Button>
			</div>
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

		/*
		 * Пунктирная рамка дропзоны. У border-style: dashed шаг штрихов задаёт браузер,
		 * поэтому рисуем её фоном: stroke-dasharray даёт и штрих, и промежуток. Толщина
		 * вдвое больше нужной — половина обводки уходит за край и обрезается.
		 */
		&__drop {
			cursor: pointer;
			display: flex;
			flex-direction: column;
			gap: 0.625rem;
			align-items: center;
			justify-content: center;
			min-height: 18rem;
			padding: 4rem 1.5rem;
			border-radius: 1rem;
			text-align: center;
			background-color: color-mix(in oklch, var(--surface) 50%, transparent);
			background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23e5e5e5' stroke-width='8' stroke-dasharray='14 10' stroke-linecap='round' rx='14' ry='14'/%3e%3c/svg%3e");
			transition: background-color 0.15s;

			&:hover,
			&--over {
				background-color: var(--surface);
				background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23d4d4d4' stroke-width='8' stroke-dasharray='14 10' stroke-linecap='round' rx='14' ry='14'/%3e%3c/svg%3e");
			}

			:global(.upload__icon) {
				color: var(--muted);
			}
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
			height: 3rem;
			margin-top: 1.25rem;
			padding: 0 2rem;
			border-radius: calc(var(--radius) * 0.8);
			font-size: 1rem;
			font-weight: 500;
			color: var(--primary-fg);
			background: var(--primary);
		}

		&__drop:hover &__button {
			background: color-mix(in oklch, var(--primary) 80%, transparent);
		}

		&__file {
			display: flex;
			gap: 0.75rem;
			align-items: center;
			justify-content: space-between;
		}

		&__name {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			min-width: 0;
			font-weight: 500;
			overflow-wrap: anywhere;

			:global(.upload__ok) {
				flex-shrink: 0;
				color: var(--success);
			}
		}

		&__summary {
			display: grid;
			gap: 0.5rem 1.5rem;

			@media (--sm) {
				grid-template-columns: max-content 1fr;
			}
		}

		&__term {
			color: var(--muted);
		}
	}
</style>
