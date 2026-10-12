<script lang="ts">
	import Building from '@lucide/svelte/icons/building-2'
	import LoaderCircle from '@lucide/svelte/icons/loader-circle'
	import Pencil from '@lucide/svelte/icons/pencil'

	import type { Carrier } from '#/core/request/build.ts'
	import AddressPicker from '#/frontend/components/AddressPicker.svelte'
	import Badge from '#/frontend/components/ui/Badge.svelte'
	import Button from '#/frontend/components/ui/Button.svelte'
	import Card from '#/frontend/components/ui/Card.svelte'
	import Field from '#/frontend/components/ui/Field.svelte'
	import Grid from '#/frontend/components/ui/Grid.svelte'
	import { wizard } from '#/frontend/lib/wizard.svelte.ts'

	const KINDS: Array<[Carrier['kind'], string]> = [
		['ЮЛ', 'Юридическое лицо'],
		['ИП', 'Предприниматель'],
	]

	/** Реквизиты, найденные по ИНН, показываем строкой — правят их редко. */
	const describe = (value: Carrier) =>
		value.kind === 'ИП' ? [value.lastName, value.firstName, value.middleName].filter(Boolean).join(' ') : value.name

	let editing = $state(false)
</script>

{#if wizard.input}
	{@const carrier = wizard.input.carrier}
	{@const known = Boolean(describe(carrier))}
	<Card>
		<Field label="ИНН перевозчика" for="carrier-inn" hint="Реквизиты подтянутся из ЕГРЮЛ или ЕГРИП.">
			<div class="carrier__inn">
				<input
					id="carrier-inn"
					class="input"
					inputmode="numeric"
					placeholder="10 цифр у юрлица, 12 у ИП"
					value={carrier.inn ?? ''}
					oninput={(event) => (carrier.inn = event.currentTarget.value.trim())}
				/>
				{#if wizard.carrierSearching}<LoaderCircle class="carrier__spinner spin" size={16} />{/if}
			</div>
		</Field>

		<!-- Ручной ввод — запасной путь для ИНН, которых нет в реестре. -->
		{#if known}
			<div class="carrier__card">
				<Building class="carrier__card-icon" size={16} />
				<div class="carrier__details">
					<p class="carrier__name">{describe(carrier)}<Badge>{carrier.kind}</Badge></p>
					<p class="hint">
						{carrier.kind === 'ИП'
							? `ОГРНИП ${carrier.ogrnip ?? '—'}`
							: `КПП ${carrier.kpp ?? '—'}, ОГРН ${carrier.ogrn ?? '—'}`}
						{wizard.carrierFound ? ' · из ЕГРЮЛ' : ' · введено вручную'}
					</p>
				</div>
				<Button variant="ghost" size="lg" onclick={() => (editing = !editing)}>
					<Pencil size={16} />
					{editing ? 'Свернуть' : 'Поправить'}
				</Button>
			</div>
		{:else}
			<div>
				<Button variant="outline" size="lg" onclick={() => (editing = !editing)}>
					<Pencil size={16} />
					{editing ? 'Свернуть' : 'Заполнить вручную'}
				</Button>
			</div>
		{/if}

		{#if editing}
			<!-- Рамка отделяет развёрнутый ручной ввод от поиска по ИНН над ним. -->
			<div class="carrier__manual">
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
						<Field label="Наименование" for="carrier-name" span={2}>
							<input id="carrier-name" class="input" bind:value={carrier.name} />
						</Field>
						<Field label="КПП" for="carrier-kpp">
							<input id="carrier-kpp" class="input" bind:value={carrier.kpp} />
						</Field>
						<Field label="ОГРН" for="carrier-ogrn">
							<input id="carrier-ogrn" class="input" bind:value={carrier.ogrn} />
						</Field>
						<Field label="Телефон" for="carrier-phone" span={2}>
							<input
								id="carrier-phone"
								class="input"
								placeholder="Необязательно, в ЕГРЮЛ его нет"
								bind:value={carrier.phone}
							/>
						</Field>
					</Grid>
				{:else}
					<Grid columns={3}>
						<Field label="Фамилия" for="carrier-last-name">
							<input id="carrier-last-name" class="input" bind:value={carrier.lastName} />
						</Field>
						<Field label="Имя" for="carrier-first-name">
							<input id="carrier-first-name" class="input" bind:value={carrier.firstName} />
						</Field>
						<Field label="Отчество" for="carrier-middle-name">
							<input id="carrier-middle-name" class="input" bind:value={carrier.middleName} />
						</Field>
					</Grid>
					<Grid>
						<Field label="ОГРНИП" for="carrier-ogrnip">
							<input id="carrier-ogrnip" class="input" bind:value={carrier.ogrnip} />
						</Field>
						<Field label="Телефон" for="carrier-phone">
							<input
								id="carrier-phone"
								class="input"
								placeholder="Необязательно, в ЕГРИП его нет"
								bind:value={carrier.phone}
							/>
						</Field>
					</Grid>
				{/if}
			</div>
		{/if}

		<AddressPicker target="carrier" label="Адрес перевозчика" address={carrier.address} />
		<p class="hint">Из ЕГРЮЛ приходит юридический адрес, а он у перевозчиков часто не тот — проверьте.</p>
	</Card>
{/if}

<style>
	.carrier {
		&__inn {
			position: relative;

			:global(.carrier__spinner) {
				position: absolute;
				top: 0.625rem;
				right: 0.75rem;
				color: var(--muted);
			}
		}

		&__card {
			display: flex;
			gap: 0.75rem;
			align-items: flex-start;
			padding: 0.75rem;
			border: 1px solid var(--border);
			border-radius: var(--radius);
			background: color-mix(in oklch, var(--surface) 40%, transparent);

			:global(.carrier__card-icon) {
				flex-shrink: 0;
				margin-top: 0.15rem;
			}
		}

		&__details {
			display: flex;
			flex: 1;
			flex-direction: column;
			gap: 0.25rem;
			min-width: 0;
		}

		&__name {
			font-weight: 500;
		}

		&__manual {
			display: flex;
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
			border: 1px solid var(--border);
			border-radius: var(--radius);
		}

		&__kind {
			display: flex;
			gap: 0.25rem;
		}

		/* Своя подсветка выбранного: бледная почти не отличима от белой карточки. */
		&__toggle {
			cursor: pointer;
			height: 2.25rem;
			padding: 0 1rem;
			border: 1px solid var(--border);
			border-radius: calc(var(--radius) * 0.8);
			background: var(--bg);

			&--on {
				border-color: var(--primary);
				color: var(--primary-fg);
				background: var(--primary);
			}
		}
	}
</style>
