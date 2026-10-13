<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check'
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert'

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
								<button type="button" class="missing__item" onclick={() => wizard.goTo(field.step)}>
									{field.label}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</section>
	{:else}
		<p class="missing missing--done">
			<CircleCheck class="missing__done-icon" size={14} />
			<span>
				Всё заполнено,
				<button
					type="button"
					class="missing__download"
					disabled={!wizard.canDownload}
					onclick={wizard.download}
				>
					скачать
				</button>
			</span>
		</p>
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

		&--done {
			flex-direction: row;
			align-items: flex-start;
			border-color: color-mix(in oklch, var(--success) 25%, transparent);
			font-size: 0.8125rem;
			font-weight: 500;
			color: var(--success);
			background: var(--success-bg);

			/* По первой строке: фраза может переноситься, значок остаётся у её начала. */
			:global(.missing__done-icon) {
				flex-shrink: 0;
				margin-top: 0.1875rem;
			}
		}

		/* Ссылкой, а не кнопкой: это продолжение фразы. Пока заявка пересобирается — бледная. */
		&__download {
			cursor: pointer;
			padding: 0;
			border: 0;
			font-weight: 600;
			color: inherit;
			text-decoration: underline;
			text-underline-offset: 2px;
			background: none;

			&:hover:not(:disabled) {
				text-decoration-thickness: 2px;
			}

			&:disabled {
				cursor: default;
				opacity: 0.6;
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
