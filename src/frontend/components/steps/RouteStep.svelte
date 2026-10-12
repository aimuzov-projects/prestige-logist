<script lang="ts">
	import PackageMinus from '@lucide/svelte/icons/package-minus'
	import PackagePlus from '@lucide/svelte/icons/package-plus'

	import { DEFAULT_TIME } from '#/core/request/constants.ts'
	import AddressPicker from '#/frontend/components/AddressPicker.svelte'
	import Card from '#/frontend/components/ui/Card.svelte'
	import { wizard } from '#/frontend/lib/wizard.svelte.ts'

	/** В форме дата живёт как ДД.ММ.ГГГГ, а input[type=date] хочет ISO. */
	const toIso = (date?: string) => {
		if (!date) return ''
		const [day, month, year] = date.split('.')
		return year ? `${year}-${month}-${day}` : date
	}

	const fromIso = (value: string) => {
		const [year, month, day] = value.split('-')
		return day ? `${day}.${month}.${year}` : value
	}

	/** Обе точки маршрута устроены одинаково: адрес и дата. */
	const POINTS = [
		{
			key: 'loading',
			title: 'Погрузка',
			icon: PackagePlus,
			address: 'loadingAddress',
			date: 'loadingDate',
			dateLabel: 'Дата подачи и погрузки',
			hint: `Из ДатОтгрС поручения, время всегда ${DEFAULT_TIME}`,
		},
		{
			key: 'unloading',
			title: 'Выгрузка',
			icon: PackageMinus,
			address: 'unloadingAddress',
			date: 'unloadingDate',
			dateLabel: 'Дата выгрузки',
			hint: 'Из ДатДостГрС, пояс — по региону адреса',
		},
	] as const
</script>

{#if wizard.input && wizard.order}
	{@const input = wizard.input}
	{@const order = wizard.order}
	<Card>
		{#each POINTS as point, index (point.key)}
			{@const fromOrder = order[point.address]}
			{#if index}<hr class="route__divider" />{/if}
			<div class="route__point">
				<!-- Подпись адресу не нужна: её роль играет заголовок точки. -->
				<h3 class="route__title">
					<point.icon class="route__icon" size={16} />
					{point.title}
				</h3>
				<AddressPicker target={point.address} address={input[point.address]} />
				{#if fromOrder.text && !input[point.address]}
					<p class="hint">В поручении строкой: «{fromOrder.text}» — найдите её поиском.</p>
				{/if}
				<div class="route__date">
					<div class="route__date-field">
						<label class="route__date-label" for={`${point.key}-date`}>{point.dateLabel}</label>
						<input
							id={`${point.key}-date`}
							class="input route__date-input"
							type="date"
							value={toIso(input[point.date])}
							oninput={(event) => (input[point.date] = fromIso(event.currentTarget.value))}
						/>
					</div>
					<p class="hint route__date-hint">{point.hint}</p>
				</div>
			</div>
		{/each}
	</Card>
{/if}

<style>
	.route {
		&__divider {
			width: 100%;
			margin: 0;
			border: 0;
			border-top: 1px solid var(--border);
		}

		&__point {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		&__title {
			display: flex;
			gap: 0.5rem;
			align-items: center;
			font-size: 0.875rem;
			font-weight: 600;

			:global(.route__icon) {
				color: var(--muted);
			}
		}

		&__date {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem;
			align-items: flex-end;
		}

		&__date-field {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
		}

		&__date-label {
			font-size: 0.75rem;
			font-weight: 500;
		}

		&__date-input {
			width: auto;
		}

		&__date-hint {
			padding-bottom: 0.5rem;
		}
	}
</style>
