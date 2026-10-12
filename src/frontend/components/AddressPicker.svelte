<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin'
	import Pencil from '@lucide/svelte/icons/pencil'
	import Search from '@lucide/svelte/icons/search'
	import X from '@lucide/svelte/icons/x'

	import { addressToText, type FiasAddress } from '#shared/address.ts'
	import type { AddressSuggestion } from '#shared/api.ts'
	import Badge from '#frontend/components/ui/Badge.svelte'
	import Button from '#frontend/components/ui/Button.svelte'
	import { api, later } from '#frontend/lib/api.ts'
	import { wizard, type AddressTarget } from '#frontend/lib/wizard.svelte.ts'

	type Props = {
		target: AddressTarget
		/** Без подписи, когда её роль уже играет заголовок блока — как у точек маршрута. */
		label?: string
		address?: FiasAddress
	}

	let { target, label, address }: Props = $props()

	/**
	 * Поиск открыт всегда ровно у одного адреса формы, поэтому его состояние живёт
	 * в самом пикере, а в визарде — только то, какой из них открыт.
	 */
	const open = $derived(wizard.addressTarget === target)
	const filled = $derived(Boolean(address && Object.keys(address).length))

	let query = $state('')
	let suggestions = $state<AddressSuggestion[]>([])
	let searching = $state(false)
	let error = $state('')

	$effect(() => {
		const text = query.trim()
		suggestions = []
		error = ''
		if (!open || text.length < 3) return

		const controller = new AbortController()
		searching = true
		later(300, controller.signal, async () => {
			try {
				;({ suggestions } = await api<{ suggestions: AddressSuggestion[] }>(
					`/api/address?query=${encodeURIComponent(text)}`,
					{ signal: controller.signal },
				))
			} catch (failure) {
				if (!controller.signal.aborted) error = (failure as Error).message
			} finally {
				if (!controller.signal.aborted) searching = false
			}
		})
		return () => {
			controller.abort()
			searching = false
		}
	})

	function toggle() {
		query = ''
		wizard.addressTarget = open ? null : target
	}

	/** Выбранный вариант раскладывается по подполям — дальше их можно править руками. */
	function apply(picked: FiasAddress) {
		const input = wizard.input
		if (!input) return
		if (target === 'carrier' || target === 'forwarder') input[target].address = picked
		else input[target] = picked
		toggle()
	}
</script>

<div class="address">
	{#if label}
		<p class="address__label">{label}</p>
	{/if}

	<!-- Кнопка равняется по первой строке адреса: длинный адрес переносится,
	     и по центру она уезжала бы от подписи. -->
	<div class="address__row">
		{#if filled}
			<p class="address__value">
				<MapPin class="address__pin" size={16} />
				<span>
					{addressToText(address)}
					{#if address?.fiasId}<Badge mono>ФИАС</Badge>{/if}
				</span>
			</p>
		{:else}
			<p class="address__value address__value--empty">Адрес не выбран</p>
		{/if}

		<Button variant="outline" size="lg" onclick={toggle}>
			{#if open}
				<X size={16} /> Отмена
			{:else if filled}
				<Pencil size={16} /> Изменить
			{:else}
				<Search size={16} /> Найти
			{/if}
		</Button>
	</div>

	{#if open}
		<div class="address__search">
			<Search class="address__search-icon" size={16} />
			<!-- svelte-ignore a11y_autofocus -->
			<input
				class="input address__query"
				placeholder="Индекс, город, улица, дом"
				aria-label="Поиск адреса"
				autofocus
				bind:value={query}
			/>
		</div>

		{#if error}<p class="address__error">{error}</p>{/if}
		{#if searching}<p class="hint">Ищем…</p>{/if}

		{#if suggestions.length || (!searching && query.trim().length >= 3)}
			<ul class="address__list">
				{#each suggestions as item (item.label)}
					<li class="address__item">
						<button type="button" class="address__option" onclick={() => apply(item.address)}>
							{item.label}
						</button>
					</li>
				{:else}
					<li class="address__item address__option address__option--empty">Ничего не нашлось</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.address {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		&__label {
			font-weight: 500;
		}

		&__row {
			display: flex;
			gap: 0.75rem;
			align-items: flex-start;
		}

		&__value {
			display: flex;
			flex: 1;
			gap: 0.5rem;
			align-items: flex-start;
			min-width: 0;
			padding-block: 0.5rem;

			&--empty {
				color: var(--muted);
			}

			:global(.address__pin) {
				flex-shrink: 0;
				margin-top: 0.15rem;
				color: var(--success);
			}
		}

		&__search {
			position: relative;

			:global(.address__search-icon) {
				position: absolute;
				top: 0.625rem;
				left: 0.625rem;
				color: var(--muted);
			}
		}

		&__query {
			padding-left: 2rem;
		}

		&__error {
			color: var(--danger);
		}

		&__list {
			border: 1px solid var(--border);
			border-radius: calc(var(--radius) * 0.8);
		}

		&__item + &__item {
			border-top: 1px solid var(--border);
		}

		&__option {
			cursor: pointer;
			width: 100%;
			padding: 0.5rem 0.75rem;
			border: 0;
			text-align: left;
			background: none;

			&:hover {
				background: var(--surface);
			}

			&--empty {
				cursor: default;
				color: var(--muted);
			}
		}
	}
</style>
