<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check'
	import Download from '@lucide/svelte/icons/download'
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
	import ChipButton from '#frontend/components/ui/chip-button.svelte'
	import { STEPS, wizard } from '#frontend/lib/wizard.svelte.ts'

	/** Пропуски по шагам и в их порядке — список читается так же, как идёт форма. */
	const groups = $derived(
		STEPS.map((step) => ({ ...step, fields: wizard.missing.filter((field) => field.step === step.id) })).filter(
			(group) => group.fields.length,
		),
	)
</script>

<!--
	Чего не хватает для выгрузки и где это заполнить. Живёт под шагами, а не над формой:
	список меняется на каждую правку, и форма под ним не должна прыгать.
-->
{#if wizard.order}
	{#if wizard.missing.length}
		<section class="missing">
			<p class="missing__title">
				<TriangleAlert size={14} />
				Осталось заполнить
			</p>
			{#each groups as group (group.id)}
				<div class="missing__group">
					<p class="missing__step">{group.title}</p>
					<ul class="missing__list">
						{#each group.fields as field (field.path)}
							<li>
								<button
									type="button"
									tabindex="-1"
									class="missing__item"
									onclick={() => wizard.goTo(field.step)}
								>
									{field.label}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</section>
	{:else}
		<div class="missing missing--done">
			<p class="missing__done-text">
				<CircleCheck class="missing__done-icon" size={14} />
				Заявка готова
			</p>
			<ChipButton tabindex={-1} onclick={wizard.tryDownload}>
				<Download size={14} />
				Скачать
			</ChipButton>
		</div>
	{/if}
{/if}

<style>
	.missing {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem;
		border: 1px solid color-mix(in oklch, var(--warning) 25%, transparent);
		border-radius: var(--radius);
		background: var(--warning-bg);

		/* На узком экране шаги — лента над формой, и счётчики уже стоят на ней. */
		@media (--below-md) {
			display: none;
		}

		/* Итог одной строкой: слева «готово», справа кнопка — как плашки с «Изменить» в форме. */
		&--done {
			flex-direction: row;
			gap: 0.25rem;
			align-items: center;
			justify-content: space-between;
			padding: 0.625rem 0.625rem 0.625rem 0.75rem;
			border-color: color-mix(in oklch, var(--success) 25%, transparent);
			background: var(--success-bg);
		}

		&__done-text {
			display: flex;
			gap: 0.375rem;
			align-items: center;
			font-size: 0.8125rem;
			font-weight: 500;
			color: var(--success);
			white-space: nowrap;

			:global(.missing__done-icon) {
				flex-shrink: 0;
			}
		}

		&__title {
			display: flex;
			gap: 0.375rem;
			align-items: center;
			font-size: 0.8125rem;
			font-weight: 600;
			color: var(--warning);
		}

		&__group {
			display: flex;
			flex-direction: column;
			gap: 0.125rem;
		}

		&__step {
			font-size: 0.6875rem;
			font-weight: 500;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		&__list {
			display: flex;
			flex-direction: column;
			margin-inline: -0.375rem;
		}

		&__item {
			cursor: pointer;
			width: 100%;
			padding: 0.25rem 0.375rem;
			border: 0;
			border-radius: calc(var(--radius-sm) - 0.125rem);
			font-size: 0.8125rem;
			line-height: 1.3;
			text-align: left;
			background: none;

			&:hover {
				background: color-mix(in oklch, var(--warning) 10%, transparent);
			}
		}
	}
</style>
