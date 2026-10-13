<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin'
	import Search from '@lucide/svelte/icons/search'

	import { addressToText, type FiasAddress } from '#shared/address.ts'
	import type { AddressSuggestion } from '#shared/api.ts'
	import InfoTip from '#frontend/components/ui/info-tip.svelte'
	import Skeleton from '#frontend/components/ui/skeleton.svelte'
	import SummaryBox from '#frontend/components/ui/summary-box.svelte'
	import { api, later } from '#frontend/lib/api.ts'
	import { wizard, type AddressTarget } from '#frontend/lib/wizard.svelte.ts'

	type Props = {
		target: AddressTarget
		/** Без подписи, когда её роль уже играет заголовок блока — как у точек маршрута. */
		label?: string
		address?: FiasAddress
		/** Обязательный адрес не выбран или выбран без ФИАС. */
		missing?: boolean
		/** С чего начать поиск: адрес строкой из поручения, если он там был. */
		initialQuery?: string
	}

	let { target, label, address, missing = false, initialQuery = '' }: Props = $props()

	const filled = $derived(Boolean(address && Object.keys(address).length))

	/**
	 * Пустой адрес ищем сразу, без лишнего щелчка. Выбранный меняют через «Изменить»,
	 * и такой поиск открыт ровно у одного адреса формы — это помнит визард.
	 */
	const editing = $derived(wizard.addressTarget === target)
	const searchable = $derived(!filled || editing)

	// svelte-ignore state_referenced_locally
	let query = $state(initialQuery)
	let suggestions = $state<AddressSuggestion[]>([])
	let searching = $state(false)
	let error = $state('')

	$effect(() => {
		const text = query.trim()
		suggestions = []
		error = ''
		if (!searchable || text.length < 3) return

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

	function setEditing(open: boolean) {
		query = ''
		wizard.addressTarget = open ? target : null
	}

	/** Выбранный вариант раскладывается по подполям — дальше их можно править руками. */
	function apply(picked: FiasAddress) {
		const input = wizard.input
		if (!input) return
		if (target === 'carrier' || target === 'forwarder') input[target].address = picked
		else input[target] = picked
		setEditing(false)
	}
</script>

{#snippet search(autofocus: boolean)}
	<div class={['address__search', missing && !filled && 'address__search--missing']}>
		<Search class="address__search-icon" size={16} />
		<!-- svelte-ignore a11y_autofocus -->
		<input
			autocomplete="off"
			class={['input', 'address__query', missing && !filled && 'input--missing']}
			placeholder="Индекс, город, улица, дом"
			aria-label={label ? `Поиск: ${label.toLowerCase()}` : 'Поиск адреса'}
			{autofocus}
			bind:value={query}
		/>
	</div>

	{#if error}<p class="address__error">{error}</p>{/if}
	{#if searching}
		<!-- Заготовка списка, пока DaData подбирает варианты: он появится ровно на этом месте. -->
		<ul class="address__list" role="status" aria-label="Ищем адрес">
			{#each [70, 55, 80] as width (width)}
				<li class="address__item address__option address__option--skeleton">
					<Skeleton width="0.875rem" height="0.875rem" round />
					<Skeleton width={`${width}%`} />
				</li>
			{/each}
		</ul>
	{:else if suggestions.length || query.trim().length >= 3}
		<ul class="address__list">
			{#each suggestions as item (item.label)}
				<li class="address__item">
					<button type="button" class="address__option" onclick={() => apply(item.address)}>
						<MapPin class="address__option-pin" size={14} />
						{item.label}
					</button>
				</li>
			{:else}
				<li class="address__item address__option address__option--empty">Ничего не нашлось</li>
			{/each}
		</ul>
	{/if}
{/snippet}

<!--
	Как у перевозчика: выбранное — плашкой-итогом, правка — в раскрывающемся блоке под ней.
	Пустой адрес сразу показывает поиск: другого действия с ним всё равно нет.
-->
<div class="address">
	{#if label}
		<p class="address__label">
			{label}{#if missing}<span class="missing-mark" title="Не заполнено"></span>{/if}
		</p>
	{/if}

	{#if filled}
		<SummaryBox id={`address-${target}`} warning={missing} bind:open={() => editing, setEditing}>
			{#snippet icon()}<MapPin size={16} />{/snippet}
			{#snippet summary()}
				<!-- Код ФИАС не подписываем: он есть у любого адреса из подсказок. Жёлтая плашка
				     и пояснение за «?» — только когда его нет. -->
				<p>
					{addressToText(address)}
					{#if missing}<InfoTip
							text="У адреса нет кода ФИАС, а без него заявку не примут. Нажмите «Изменить» и выберите адрес из подсказок."
						/>{/if}
				</p>
			{/snippet}
			{@render search(true)}
		</SummaryBox>
	{:else}
		{@render search(false)}
	{/if}
</div>

<style>
	.address {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;

		&__label {
			font-size: 0.8125rem;
			font-weight: 500;
		}

		&__search {
			position: relative;

			:global(.address__search-icon) {
				position: absolute;
				top: 0.75rem;
				left: 0.75rem;
				color: var(--muted);
			}

			/* Иконка в тон подсказке незаполненного поля, см. .input--missing. */
			&--missing :global(.address__search-icon) {
				color: color-mix(in oklch, var(--warning) 65%, var(--warning-bg));
			}
		}

		&__query {
			padding-left: 2.25rem;
		}

		&__error {
			color: var(--danger);
		}

		&__list {
			overflow-y: auto;
			max-height: 15rem;
			border: 1px solid var(--border);
			border-radius: var(--radius-sm);
			background: var(--bg);
			box-shadow: var(--shadow-sm);
		}

		&__item + &__item {
			border-top: 1px solid var(--border);
		}

		&__option {
			cursor: pointer;
			display: flex;
			gap: 0.5rem;
			align-items: flex-start;
			width: 100%;
			padding: 0.5rem 0.75rem;
			border: 0;
			text-align: left;
			background: none;

			&:hover {
				background: var(--hover-bg);
			}

			&--empty {
				cursor: default;
				color: var(--muted);
			}

			/* Строка-заготовка ростом с настоящий вариант: список не прыгает, когда данные придут. */
			&--skeleton {
				cursor: default;
				align-items: center;
				min-height: 2.3rem;

				&:hover {
					background: none;
				}
			}

			:global(.address__option-pin) {
				flex-shrink: 0;
				margin-top: 0.2rem;
				color: var(--muted);
			}
		}
	}
</style>
