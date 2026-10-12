<script lang="ts">
	import Building from '@lucide/svelte/icons/building-2'
	import ChevronDown from '@lucide/svelte/icons/chevron-down'
	import Package from '@lucide/svelte/icons/package'
	import Pencil from '@lucide/svelte/icons/pencil'
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert'

	import type { PackagingKind } from '#shared/api.ts'
	import type { PersonName } from '#shared/order.ts'
	import AddressPicker from '#frontend/components/AddressPicker.svelte'
	import Alert from '#frontend/components/ui/Alert.svelte'
	import Badge from '#frontend/components/ui/Badge.svelte'
	import Button from '#frontend/components/ui/Button.svelte'
	import Card from '#frontend/components/ui/Card.svelte'
	import Field from '#frontend/components/ui/Field.svelte'
	import Grid from '#frontend/components/ui/Grid.svelte'
	import { api, later } from '#frontend/lib/api.ts'
	import { wizard } from '#frontend/lib/wizard.svelte.ts'

	let editingForwarder = $state(false)
	let pickingKind = $state(false)
	let showDetails = $state(false)

	let packagingQuery = $state('')
	let kinds = $state<PackagingKind[]>([])

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

{#if wizard.input && wizard.order}
	{@const input = wizard.input}
	{@const order = wizard.order}
	{@const signatoryFromTitle = Boolean(order.signatory?.position || order.signatory?.name)}
	<div class="request">
		<!-- Первым делом — чего не хватает для выгрузки и куда за этим идти. Когда всё
		     заполнено, говорить нечего: кнопка выгрузки просто становится доступной. -->
		{#if wizard.missing.length}
			<Alert title="Осталось заполнить">
				{#snippet icon()}<TriangleAlert size={16} />{/snippet}
				<ul class="request__gaps">
					{#each wizard.missing as field (field.path)}
						<li>
							<button type="button" class="request__gap" onclick={() => wizard.goTo(field.step)}>
								{field.label}
							</button>
						</li>
					{/each}
				</ul>
			</Alert>
		{/if}

		<Card title="Заявка">
			<Field
				label="Номер заказа"
				for="order-number"
				hint="Дата и время формирования проставятся сами в момент сборки."
			>
				<input id="order-number" class="input request__number" bind:value={input.orderNumber} />
			</Field>
		</Card>

		<Card title="Груз">
			<dl class="request__cargo">
				<dt class="request__term">Наименование</dt>
				<dd>{order.cargo.name || '—'}</dd>
				<dt class="request__term">Мест</dt>
				<dd>{order.cargo.packageCount || '—'}</dd>
				<dt class="request__term">Вес брутто, кг</dt>
				<dd>{order.cargo.grossWeight || '—'}</dd>
			</dl>
			<p class="hint">Эти три поля берутся из поручения.</p>

			<Field label="Вид тары" for="packaging-query">
				{#if input.packageKind && !pickingKind}
					<div class="request__kind">
						<Package size={16} />
						<Badge mono>{input.packageKind}</Badge>
						{kinds.find((kind) => kind.code === input.packageKind)?.name}
						<Button variant="ghost" size="lg" onclick={() => (pickingKind = true)}>
							<Pencil size={16} />
							Изменить
						</Button>
					</div>
				{:else}
					<input
						id="packaging-query"
						class="input"
						placeholder="Найдите по названию или коду: поддон, ящик, 8A"
						bind:value={packagingQuery}
					/>
					<ul class="request__kinds">
						{#each kinds as kind (kind.code)}
							<li class="request__kind-item">
								<button
									type="button"
									class="request__kind-option"
									onclick={() => {
										input.packageKind = kind.code
										pickingKind = false
									}}
								>
									<span class="mono">{kind.code}</span>
									{kind.name}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</Field>
		</Card>

		<!-- Свои реквизиты и подписант приходят готовыми — прячем их, чтобы не мешали. -->
		<Button variant="outline" size="lg" wide onclick={() => (showDetails = !showDetails)}>
			<span class="request__toggle">
				<Building size={16} />
				Грузоотправитель и подписант
			</span>
			<ChevronDown class={['request__chevron', showDetails && 'request__chevron--open']} size={16} />
		</Button>

		{#if showDetails}
			<Card title="Грузоотправитель (мы)">
				<div class="request__forwarder">
					<div class="request__forwarder-text">
						<p class="request__forwarder-name">{input.forwarder.fullName || '—'}</p>
						<p class="hint">
							ИНН {order.forwarder.inn}, КПП {order.forwarder.kpp} · наименование из ЕГРЮЛ
						</p>
					</div>
					<Button variant="ghost" size="lg" onclick={() => (editingForwarder = !editingForwarder)}>
						<Pencil size={16} />
						{editingForwarder ? 'Свернуть' : 'Поправить'}
					</Button>
				</div>
				{#if editingForwarder}
					<Field label="Полное наименование" for="forwarder-name">
						<input id="forwarder-name" class="input" bind:value={input.forwarder.fullName} />
					</Field>
				{/if}
				<AddressPicker target="forwarder" label="Адрес грузоотправителя" address={input.forwarder.address} />
			</Card>

			<Card title="Подписант">
				{#if signatoryFromTitle}
					<div>
						<p>
							{order.signatory?.position}
							{#if order.signatory?.name}
								<span class="request__muted"> · {fullName(order.signatory.name)}</span>
							{/if}
						</p>
						<p class="hint">Из титула экспедитора — править не нужно.</p>
					</div>
				{:else}
					<!-- Подписанта спрашиваем, только когда титула экспедитора в комплекте не было. -->
					<p class="request__muted">
						Титула экспедитора в комплекте не было, поэтому подписанта заполните сами.
					</p>
					<Grid>
						<Field label="Должность" for="signatory-position" span={2}>
							<input
								id="signatory-position"
								class="input"
								value={input.signatory?.position ?? ''}
								oninput={(event) =>
									(input.signatory = { ...input.signatory, position: event.currentTarget.value })}
							/>
						</Field>
						<Field label="Фамилия" for="signatory-last-name">
							<input
								id="signatory-last-name"
								class="input"
								value={input.signatory?.name?.lastName ?? ''}
								oninput={(event) => patchName({ lastName: event.currentTarget.value })}
							/>
						</Field>
						<Field label="Имя" for="signatory-first-name">
							<input
								id="signatory-first-name"
								class="input"
								value={input.signatory?.name?.firstName ?? ''}
								oninput={(event) => patchName({ firstName: event.currentTarget.value })}
							/>
						</Field>
					</Grid>
				{/if}
			</Card>
		{/if}

		{#if wizard.buildError}
			<Alert variant="danger" title="Заявка не собралась">{wizard.buildError}</Alert>
		{/if}
	</div>
{/if}

<style>
	.request {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__gaps {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
		}

		&__gap {
			cursor: pointer;
			padding: 0;
			border: 0;
			text-decoration: underline;
			text-underline-offset: 2px;
			background: none;
		}

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

		&__kind {
			display: flex;
			gap: 0.5rem;
			align-items: center;
		}

		&__kinds {
			overflow-y: auto;
			max-height: 14rem;
			border: 1px solid var(--border);
			border-radius: calc(var(--radius) * 0.8);
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
				background: var(--surface);
			}
		}

		&__toggle {
			display: flex;
			gap: 0.5rem;
			align-items: center;
		}

		:global(.request__chevron) {
			transition: transform 0.15s;
		}

		:global(.request__chevron--open) {
			transform: rotate(180deg);
		}

		&__forwarder {
			display: flex;
			gap: 0.75rem;
			align-items: center;
			justify-content: space-between;
		}

		&__forwarder-text {
			min-width: 0;
		}

		&__forwarder-name {
			font-weight: 500;
		}
	}
</style>
