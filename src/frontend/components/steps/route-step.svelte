<script lang="ts">
	import PackageMinus from '@lucide/svelte/icons/package-minus'
	import PackagePlus from '@lucide/svelte/icons/package-plus'
	import { DEFAULT_TIME } from '#shared/request.ts'
	import AddressPicker from '#frontend/components/address-picker.svelte'
	import Card from '#frontend/components/ui/card.svelte'
	import InfoTip from '#frontend/components/ui/info-tip.svelte'
	import { wizard } from '#frontend/lib/wizard.svelte.ts'

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

	const TEXT_ADDRESS =
		'В поручении адрес пришёл строкой, без кода ФИАС. Он уже в поиске — выберите подходящий вариант.'

	/** Обе точки маршрута устроены одинаково: адрес и дата. */
	const POINTS = [
		{
			key: 'loading',
			title: 'Погрузка',
			icon: PackagePlus,
			address: 'loadingAddress',
			date: 'loadingDate',
			dateLabel: 'Дата подачи и погрузки',
			hint: `Подставлена первая дата отгрузки из поручения. Время в заявке — ${DEFAULT_TIME.slice(0, 5)}`,
		},
		{
			key: 'unloading',
			title: 'Выгрузка',
			icon: PackageMinus,
			address: 'unloadingAddress',
			date: 'unloadingDate',
			dateLabel: 'Дата выгрузки',
			hint: 'Подставлена первая дата доставки из поручения. Часовой пояс возьмём по адресу выгрузки',
		},
	] as const
</script>

<!-- Каждая точка — свой островок, как реквизиты и адрес у перевозчика. -->
{#if wizard.input && wizard.order}
	{@const input = wizard.input}
	{@const order = wizard.order}
	<div class="route">
		{#each POINTS as point (point.key)}
			{@const fromOrder = order[point.address]}
			{@const dateMissing = wizard.missingPaths.has(point.date)}
			<Card
				title={point.title}
				icon={point.icon}
				info={fromOrder.text && !input[point.address] ? TEXT_ADDRESS : undefined}
			>
				<!-- Дата — в шапке карточки: адресу нужна вся ширина, а дате хватает угла. -->
				{#snippet action()}
					<label class="route__date-label" for={`${point.key}-date`}>
						Дата{#if dateMissing}<span class="missing-mark" title="Не заполнено"></span>{/if}
					</label>
					<input
						autocomplete="off"
						id={`${point.key}-date`}
						class={['input', 'route__date', dateMissing && 'input--missing']}
						type="date"
						aria-label={point.dateLabel}
						value={toIso(input[point.date])}
						oninput={(event) => (input[point.date] = fromIso(event.currentTarget.value))}
					/>
					<InfoTip text={`${point.dateLabel}. ${point.hint}`} />
				{/snippet}
				<!-- Подпись адресу не нужна: её роль играет заголовок карточки. -->
				<AddressPicker
					target={point.address}
					address={input[point.address]}
					missing={wizard.missingPaths.has(point.address)}
					initialQuery={fromOrder.text}
				/>
			</Card>
		{/each}
	</div>
{/if}

<style>
	.route {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__date-label {
			margin-right: 0.125rem;
			color: var(--muted);
		}

		/* Компактное поле — ростом со строку заголовка, чтобы шапка не стала выше соседних. */
		&__date {
			width: auto;
			height: 1.75rem;
			margin-block: -0.125rem;
			padding: 0 0.5rem;
			font-size: 0.8125rem;
			font-variant-numeric: tabular-nums;

			/* Мельче 16px Safari на iPhone приближает поле — см. .input. */
			@media (--touch) {
				font-size: 1rem;
			}
		}
	}
</style>
