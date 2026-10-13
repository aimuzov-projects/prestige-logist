<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text'
	import MapPin from '@lucide/svelte/icons/map-pin'
	import Building from '@lucide/svelte/icons/building-2'
	import LoaderCircle from '@lucide/svelte/icons/loader-circle'

	import type { Carrier } from '#shared/request.ts'
	import AddressPicker from '#frontend/components/address-picker.svelte'
	import Badge from '#frontend/components/ui/badge.svelte'
	import Card from '#frontend/components/ui/card.svelte'
	import CopyValue from '#frontend/components/ui/copy-value.svelte'
	import Disclosure from '#frontend/components/ui/disclosure.svelte'
	import Field from '#frontend/components/ui/field.svelte'
	import Grid from '#frontend/components/ui/grid.svelte'
	import Skeleton from '#frontend/components/ui/skeleton.svelte'
	import SummaryBox from '#frontend/components/ui/summary-box.svelte'
	import { wizard } from '#frontend/lib/wizard.svelte.ts'

	const KINDS: Array<[Carrier['kind'], string]> = [
		['ЮЛ', 'Юридическое лицо'],
		['ИП', 'Предприниматель'],
	]

	let editing = $state(false)

	/**
	 * Найденное показываем плашкой. Пока её правят, она не пропадает, даже если стёрли
	 * наименование или сменили тип: иначе блок прыгал бы обратно в раскрывашку.
	 */
	let boxed = $state(false)
	$effect(() => {
		if (wizard.carrierName) boxed = true
		else if (!editing) boxed = false
	})
</script>

{#snippet manual(carrier: Carrier)}
	<div class="carrier__kind" role="radiogroup" aria-label="Тип перевозчика">
		{#each KINDS as [kind, title] (kind)}
			<button
				type="button"
				role="radio"
				aria-checked={carrier.kind === kind}
				class={['carrier__toggle', carrier.kind === kind && 'carrier__toggle--on']}
				onclick={() => (carrier.kind = kind)}
			>
				{title}
			</button>
		{/each}
	</div>

	{#if carrier.kind === 'ЮЛ'}
		<Grid>
			<Field label="Наименование" for="carrier-name" span={2} missing={wizard.missingPaths.has('carrier.name')}>
				<input
					autocomplete="off"
					id="carrier-name"
					class={['input', wizard.missingPaths.has('carrier.name') && 'input--missing']}
					bind:value={carrier.name}
				/>
			</Field>
			<Field label="КПП" for="carrier-kpp">
				<input autocomplete="off" id="carrier-kpp" class="input" bind:value={carrier.kpp} />
			</Field>
			<Field label="ОГРН" for="carrier-ogrn">
				<input autocomplete="off" id="carrier-ogrn" class="input" bind:value={carrier.ogrn} />
			</Field>
			<Field label="Телефон" for="carrier-phone" span={2}>
				<input
					autocomplete="off"
					id="carrier-phone"
					class="input"
					placeholder="Необязательно, в ЕГРЮЛ его нет"
					bind:value={carrier.phone}
				/>
			</Field>
		</Grid>
	{:else}
		<Grid columns={3}>
			<Field
				label="Фамилия"
				for="carrier-last-name"
				missing={wizard.missingPaths.has('carrier.name') && !carrier.lastName?.trim()}
			>
				<input
					autocomplete="off"
					id="carrier-last-name"
					class={[
						'input',
						wizard.missingPaths.has('carrier.name') && !carrier.lastName?.trim() && 'input--missing',
					]}
					bind:value={carrier.lastName}
				/>
			</Field>
			<Field
				label="Имя"
				for="carrier-first-name"
				missing={wizard.missingPaths.has('carrier.name') && !carrier.firstName?.trim()}
			>
				<input
					autocomplete="off"
					id="carrier-first-name"
					class={[
						'input',
						wizard.missingPaths.has('carrier.name') && !carrier.firstName?.trim() && 'input--missing',
					]}
					bind:value={carrier.firstName}
				/>
			</Field>
			<Field label="Отчество" for="carrier-middle-name">
				<input autocomplete="off" id="carrier-middle-name" class="input" bind:value={carrier.middleName} />
			</Field>
		</Grid>
		<Grid>
			<Field label="ОГРНИП" for="carrier-ogrnip">
				<input autocomplete="off" id="carrier-ogrnip" class="input" bind:value={carrier.ogrnip} />
			</Field>
			<Field label="Телефон" for="carrier-phone">
				<input
					autocomplete="off"
					id="carrier-phone"
					class="input"
					placeholder="Необязательно, в ЕГРИП его нет"
					bind:value={carrier.phone}
				/>
			</Field>
		</Grid>
	{/if}
{/snippet}

{#if wizard.input}
	{@const carrier = wizard.input.carrier}
	<div class="carrier">
		<Card title="Реквизиты" icon={FileText} info="Найдём по ИНН в ЕГРЮЛ или ЕГРИП. Если там нет — введите вручную.">
			<Field label="ИНН перевозчика" for="carrier-inn" missing={wizard.missingPaths.has('carrier.inn')}>
				<div class="carrier__inn">
					<input
						autocomplete="off"
						id="carrier-inn"
						class={['input', wizard.missingPaths.has('carrier.inn') && 'input--missing']}
						inputmode="numeric"
						placeholder="10 цифр у юрлица, 12 у ИП"
						value={carrier.inn ?? ''}
						oninput={(event) => (carrier.inn = event.currentTarget.value.trim())}
					/>
					{#if wizard.carrierSearching}<LoaderCircle class="carrier__spinner spin" size={16} />{/if}
				</div>
			</Field>

			<!-- Найденное — плашкой с «Изменить», как выбранный адрес. Ручной ввод — запасной путь
			     для ИНН, которых нет в реестре: пока ничего не нашлось, он в раскрывашке. -->
			{#if wizard.carrierSearching}
				<!-- Заготовка плашки, пока реестр ищет ИНН: она встанет ровно сюда. -->
				<div class="carrier__skeleton" role="status" aria-label="Ищем перевозчика">
					<Skeleton width="1rem" height="1rem" />
					<div class="carrier__skeleton-lines">
						<Skeleton width="60%" height="1rem" />
						<Skeleton width="40%" />
					</div>
				</div>
			{:else if boxed}
				<SummaryBox id="carrier-manual" bind:open={editing}>
					{#snippet icon()}<Building size={16} />{/snippet}
					{#snippet summary()}
						<p class="carrier__name">
							{wizard.carrierName || 'Без наименования'}<Badge>{carrier.kind}</Badge>
						</p>
						<p class="carrier__codes">
							{#if carrier.inn}<CopyValue label="ИНН" value={carrier.inn} />{/if}
							{#if carrier.kind === 'ИП'}
								{#if carrier.ogrnip}<CopyValue label="ОГРНИП" value={carrier.ogrnip} />{/if}
							{:else}
								{#if carrier.kpp}<CopyValue label="КПП" value={carrier.kpp} />{/if}
								{#if carrier.ogrn}<CopyValue label="ОГРН" value={carrier.ogrn} />{/if}
							{/if}
						</p>
					{/snippet}
					{@render manual(carrier)}
				</SummaryBox>
			{:else}
				<Disclosure
					id="carrier-manual"
					title="Ввести реквизиты вручную"
					missing={wizard.missingPaths.has('carrier.name')}
					bind:open={editing}
				>
					{@render manual(carrier)}
				</Disclosure>
			{/if}
		</Card>

		<Card
			title="Адрес"
			icon={MapPin}
			info="Из ЕГРЮЛ приходит юридический адрес, а он у перевозчиков часто не тот — проверьте."
		>
			<AddressPicker
				target="carrier"
				address={carrier.address}
				missing={wizard.missingPaths.has('carrier.address')}
			/>
		</Card>
	</div>
{/if}

<style>
	.carrier {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		&__inn {
			position: relative;

			:global(.carrier__spinner) {
				position: absolute;
				top: 0.625rem;
				right: 0.75rem;
				color: var(--muted);
			}
		}

		&__codes {
			display: flex;
			flex-wrap: wrap;
			gap: 0.375rem 1rem;
			font-size: 0.8125rem;
		}

		/* Ростом и отступами как плашка SummaryBox, которую заменяет. */
		&__skeleton {
			display: flex;
			gap: 0.75rem;
			align-items: flex-start;
			padding: 0.75rem 1rem;
			border-radius: var(--radius-sm);
			background: var(--surface);
		}

		&__skeleton-lines {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.5rem;
		}

		&__name {
			font-weight: 500;
		}

		/* Сегменты в общей подложке, как у переключателя: выбор один из двух. */
		&__kind {
			display: inline-flex;
			gap: 0.25rem;
			align-self: flex-start;
			padding: 0.25rem;
			border-radius: var(--radius-sm);
			background: var(--surface);

			/* «Предприниматель» не переносится, двум сегментам в ряд на телефоне тесно. */
			@media (--below-sm) {
				flex-direction: column;
				align-self: stretch;
			}
		}

		&__toggle {
			cursor: pointer;
			flex: 1;
			min-height: 2rem;
			padding: 0.25rem 0.875rem;
			border: 0;
			border-radius: calc(var(--radius-sm) - 0.125rem);
			font-weight: 500;
			line-height: 1.25;
			color: var(--muted);
			background: none;

			@media (--below-sm) {
				padding-inline: 0.5rem;
			}

			@media (--sm) {
				white-space: nowrap;
			}

			&--on {
				color: var(--fg);
				background: var(--bg);
				box-shadow:
					var(--shadow-sm),
					0 0 0 1px var(--border);
			}
		}
	}
</style>
