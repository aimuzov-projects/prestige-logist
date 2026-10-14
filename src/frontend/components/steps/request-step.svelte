<script lang="ts">
	import ClipboardList from '@lucide/svelte/icons/clipboard-list'
	import Building from '@lucide/svelte/icons/building'
	import Package from '@lucide/svelte/icons/package'
	import UserPen from '@lucide/svelte/icons/user-pen'

	import type { PackagingKind } from '#shared/api.ts'
	import type { PersonName } from '#shared/order.ts'
	import type { RequestInput } from '#shared/request.ts'
	import AddressPicker from '#frontend/components/address-picker.svelte'
	import Alert from '#frontend/components/ui/alert.svelte'
	import Card from '#frontend/components/ui/card.svelte'
	import CopyValue from '#frontend/components/ui/copy-value.svelte'
	import Field from '#frontend/components/ui/field.svelte'
	import Grid from '#frontend/components/ui/grid.svelte'
	import SummaryBox from '#frontend/components/ui/summary-box.svelte'
	import { api, later } from '#frontend/lib/api.ts'
	import { enterList, moveInList } from '#frontend/lib/list-keys.ts'
	import { wizard } from '#frontend/lib/wizard.svelte.ts'

	let editingForwarder = $state(false)
	let pickingKind = $state(false)

	let packagingQuery = $state('')
	let kindInput = $state<HTMLInputElement>()
	let kindList = $state<HTMLUListElement>()
	let kinds = $state<PackagingKind[]>([])
	/** Название выбранной тары: список справочника меняется с каждым запросом, а код остаётся. */
	let pickedName = $state('')
	const kindName = $derived(pickedName || kinds.find((kind) => kind.code === wizard.input?.packageKind)?.name || '')

	function pick(input: RequestInput, kind: PackagingKind) {
		input.packageKind = kind.code
		pickedName = kind.name
		pickingKind = false
		packagingQuery = ''
	}

	// Пустой запрос тоже ищем: справочник отдаёт первые позиции, и выбрать можно сразу.
	$effect(() => {
		const query = packagingQuery.trim()
		const controller = new AbortController()

		later(250, controller.signal, async () => {
			try {
				;({ kinds } = await api<{ kinds: PackagingKind[] }>(
					`/api/packaging?query=${encodeURIComponent(query)}`,
					{ signal: controller.signal },
				))
			} catch {
				// Справочник Контура недоступен — список просто останется прежним.
			}
		})

		return () => controller.abort()
	})

	const fullName = (name?: PersonName) =>
		[name?.lastName, name?.firstName, name?.middleName].filter(Boolean).join(' ')

	/** Подписанта в разобранном поручении может не быть вовсе, поэтому собираем его по частям. */
	function patchName(part: PersonName) {
		const input = wizard.input

		if (input) input.signatory = { ...input.signatory, name: { ...input.signatory?.name, ...part } }
	}
</script>

{#snippet kindSearch(input: RequestInput)}
	<input
		autocomplete="off"
		id="packaging-query"
		class="input"
		placeholder="Найдите по названию или коду: поддон, ящик, 8A"
		bind:this={kindInput}
		bind:value={packagingQuery}
		onkeydown={(event) => enterList(event, kindList)}
	/>
	{#if kinds.length}
		<!-- Сам список из Tab убран: прокручиваемый блок Chrome иначе выделяет целиком. -->
		<ul class="request__kinds" tabindex="-1" bind:this={kindList}>
			{#each kinds as kind (kind.code)}
				<li class="request__kind-item">
					<button
						type="button"
						class="request__kind-option"
						onclick={() => pick(input, kind)}
						onkeydown={(event) => moveInList(event, kindInput)}
					>
						<span class="mono">{kind.code}</span>
						{kind.name}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

{#if wizard.input && wizard.order}
	{@const input = wizard.input}
	{@const order = wizard.order}
	{@const signatoryFromTitle = Boolean(order.signatory?.position || order.signatory?.name)}
	{@const forwarderNameMissing = wizard.missingPaths.has('forwarder.fullName')}
	<div class="request">
		<Card title="Заявка" icon={ClipboardList}>
			<Field
				label="Номер заказа"
				for="order-number"
				missing={wizard.missingPaths.has('orderNumber')}
				hint="Дата и время формирования проставятся сами в момент сборки."
			>
				<input
					autocomplete="off"
					id="order-number"
					class={['input', 'request__number', wizard.missingPaths.has('orderNumber') && 'input--missing']}
					bind:value={input.orderNumber}
				/>
			</Field>
		</Card>

		<Card title="Груз" icon={Package} info="Наименование, места и вес берутся из поручения.">
			<dl class="request__cargo">
				<dt class="request__term">Наименование</dt>
				<dd>{order.cargo.name || '—'}</dd>
				<dt class="request__term">Мест</dt>
				<dd>{order.cargo.packageCount || '—'}</dd>
				<dt class="request__term">Вес брутто, кг</dt>
				<dd>{order.cargo.grossWeight || '—'}</dd>
			</dl>

			<!-- Как адрес: выбранное — плашкой с «Изменить», пустое — сразу поиском. -->
			<Field label="Вид тары" for={input.packageKind && !pickingKind ? undefined : 'packaging-query'}>
				{#if input.packageKind}
					<SummaryBox id="packaging" bind:open={pickingKind}>
						{#snippet icon()}<Package size={16} />{/snippet}
						{#snippet summary()}
							<p>
								<span class="mono">{input.packageKind}</span>
								{kindName}
							</p>
						{/snippet}
						{@render kindSearch(input)}
					</SummaryBox>
				{:else}
					{@render kindSearch(input)}
				{/if}
			</Field>
		</Card>

		<!-- Как перевозчик: свои реквизиты — плашкой с «Изменить», адрес — тем же пикером. -->
		<Card title="Грузоотправитель" icon={Building} info="Это мы: реквизиты и адрес берутся из поручения.">
			<SummaryBox id="forwarder-manual" warning={forwarderNameMissing} bind:open={editingForwarder}>
				{#snippet icon()}<Building size={16} />{/snippet}
				{#snippet summary()}
					<p class="request__forwarder-name">{input.forwarder.fullName || 'Без наименования'}</p>
					<p class="request__codes">
						{#if order.forwarder.inn}<CopyValue label="ИНН" value={order.forwarder.inn} />{/if}
						{#if order.forwarder.kpp}<CopyValue label="КПП" value={order.forwarder.kpp} />{/if}
					</p>
				{/snippet}
				<Field label="Полное наименование" for="forwarder-name" missing={forwarderNameMissing}>
					<input
						autocomplete="off"
						id="forwarder-name"
						class={['input', forwarderNameMissing && 'input--missing']}
						bind:value={input.forwarder.fullName}
					/>
				</Field>
			</SummaryBox>
			<AddressPicker
				target="forwarder"
				label="Адрес"
				address={input.forwarder.address}
				missing={wizard.missingPaths.has('forwarder.address')}
			/>
		</Card>

		<Card
			title="Подписант"
			icon={UserPen}
			info={signatoryFromTitle
				? 'Взят из титула экспедитора, править не нужно.'
				: 'Титула экспедитора в комплекте не было, поэтому подписанта заполните сами.'}
		>
			{#if signatoryFromTitle}
				<p class="request__signer">
					<UserPen class="request__signer-icon" size={16} />
					<span>
						{order.signatory?.position}{#if order.signatory?.name}<span class="request__muted"
								> · {fullName(order.signatory.name)}</span
							>{/if}
					</span>
				</p>
			{:else}
				<Grid>
					<Field label="Должность" for="signatory-position" span={2}>
						<input
							autocomplete="off"
							id="signatory-position"
							class="input"
							value={input.signatory?.position ?? ''}
							oninput={(event) =>
								(input.signatory = { ...input.signatory, position: event.currentTarget.value })}
						/>
					</Field>
					<Field label="Фамилия" for="signatory-last-name">
						<input
							autocomplete="off"
							id="signatory-last-name"
							class="input"
							value={input.signatory?.name?.lastName ?? ''}
							oninput={(event) => patchName({ lastName: event.currentTarget.value })}
						/>
					</Field>
					<Field label="Имя" for="signatory-first-name">
						<input
							autocomplete="off"
							id="signatory-first-name"
							class="input"
							value={input.signatory?.name?.firstName ?? ''}
							oninput={(event) => patchName({ firstName: event.currentTarget.value })}
						/>
					</Field>
				</Grid>
			{/if}
		</Card>

		{#if wizard.buildError}
			<Alert variant="danger" title="Заявка не собралась">{wizard.buildError}</Alert>
		{/if}
	</div>
{/if}

<style>
	.request {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__number {
			max-width: 20rem;
		}

		&__cargo {
			display: grid;
			gap: 0.25rem 1.5rem;

			@media (--sm) {
				grid-template-columns: max-content 1fr;
			}
		}

		&__term,
		&__muted {
			color: var(--muted);
		}

		&__kinds {
			overflow-y: auto;
			max-height: 14rem;
			border: 1px solid var(--border);
			border-radius: var(--radius-sm);
			background: var(--bg);
			box-shadow: var(--shadow-sm);
		}

		&__kind-item + &__kind-item {
			border-top: 1px solid var(--border);
		}

		&__kind-option {
			cursor: pointer;
			display: flex;
			gap: 0.75rem;
			align-items: center;
			width: 100%;
			padding: 0.5rem 0.75rem;
			border: 0;
			text-align: left;
			background: none;

			&:hover {
				background: var(--hover-bg);
			}

			/* Список прокручивается и обрезает внешнюю рамку — фокус рисуем внутри строки. */
			&:focus-visible {
				background: var(--hover-bg);
				outline: none;
				box-shadow: inset 0 0 0 2px var(--ring);
			}
		}

		/* Подписант из титула не правится: нейтральная серая плашка, голубая значила бы «можно изменить». */
		&__signer {
			display: flex;
			gap: 0.75rem;
			align-items: center;
			min-height: 2.5rem;
			padding: 0.4375rem 1rem;
			border-radius: var(--radius-sm);
			background: var(--surface);

			:global(.request__signer-icon) {
				flex-shrink: 0;
				color: var(--muted);
			}
		}

		&__codes {
			display: flex;
			flex-wrap: wrap;
			gap: 0.375rem 1rem;
			font-size: 0.8125rem;
		}

		&__forwarder-name {
			font-weight: 500;
		}
	}
</style>
