<script lang="ts">
	import '@aimuzov-projects/infra-site-kit/theme-peek.css'
	import Moon from '@lucide/svelte/icons/moon'
	import Sun from '@lucide/svelte/icons/sun'
	import SunMoon from '@lucide/svelte/icons/sun-moon'
	import {
		nextTheme,
		toggleTheme,
		watchTheme,
		type Scheme,
		type Theme,
	} from '@aimuzov-projects/infra-site-kit/theme.js'
	import { themePeek } from '@aimuzov-projects/infra-site-kit/theme-peek.js'
	import { onMount, tick } from 'svelte'

	import Button from '#frontend/components/ui/button.svelte'

	// Выбор до отрисовки ставит ThemeBoot в layouts/base.astro, ключ по умолчанию у обоих.
	const VIEW = {
		auto: { icon: SunMoon, label: 'как в системе' },
		light: { icon: Sun, label: 'светлая' },
		dark: { icon: Moon, label: 'тёмная' },
	}
	const ACTION: Record<Scheme, string> = { light: 'Включить светлую тему', dark: 'Включить тёмную тему' }
	/** Отступ подсказки от края экрана. */
	const EDGE = 8

	/** Убрать из Tab: в мастере клавиатурой ходят только по полям формы. */
	let { skipTab = false }: { skipTab?: boolean } = $props()

	let theme = $state<Theme>('auto')
	let system = $state<Scheme>('light')
	const view = $derived(VIEW[theme])
	const next = $derived(nextTheme(theme, system))
	const action = $derived(next === 'auto' ? 'Вернуть тему как в системе' : ACTION[next])
	const tipId = $props.id()

	let anchor: HTMLElement | undefined
	let tip: HTMLElement

	// На сервере document нет: выбор, уже применённый ThemeBoot, читаем в браузере.
	onMount(() =>
		watchTheme((current, scheme) => {
			theme = current
			system = scheme
			// Текст подсказки сменился вместе с темой, ширина с ним: центруем заново.
			tick().then(place)
		}),
	)

	/**
	 * Подсказка живёт в верхнем слое (popover), иначе её накрыл бы круг с другой темой.
	 * Там она вне раскладки, поэтому ставим её под кнопкой сами и не даём уйти за край.
	 */
	function place() {
		if (!anchor || !tip.matches(':popover-open')) return

		const rect = anchor.getBoundingClientRect()
		const width = tip.offsetWidth
		const center = rect.left + rect.width / 2
		const limit = document.documentElement.clientWidth - EDGE - width

		tip.style.left = `${Math.max(EDGE, Math.min(center - width / 2, limit))}px`
		tip.style.top = `${rect.bottom + 6}px`
	}

	function showTip(event: Event) {
		anchor = event.currentTarget as HTMLElement
		tip.showPopover()
		place()
	}

	function hideTip() {
		if (tip.matches(':popover-open')) tip.hidePopover()
	}
</script>

<Button
	variant="ghost"
	size="lg"
	aria-label={`Тема: ${view.label}. Переключить`}
	aria-describedby={tipId}
	tabindex={skipTab ? -1 : undefined}
	onclick={() => toggleTheme()}
	onpointerenter={showTip}
	onpointerleave={hideTip}
	onfocus={showTip}
	onblur={hideTip}
	{@attach themePeek}
>
	<view.icon size={16} />
</Button>
<span bind:this={tip} id={tipId} role="tooltip" popover="manual" class="theme-tip">{action}</span>

<svelte:window onscroll={place} onresize={place} />

<style>
	/* Внешний вид как у info-tip. Popover по умолчанию по центру экрана: сбрасываем. */
	.theme-tip {
		pointer-events: none;
		position: fixed;
		inset: auto;
		margin: 0;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		line-height: 1.45;
		color: var(--fg);
		white-space: nowrap;
		background: var(--bg);
		box-shadow: var(--shadow-md);
		animation: tip-in 0.15s;

		@media (--reduced-motion) {
			animation: none;
		}
	}

	@keyframes tip-in {
		from {
			opacity: 0;
		}
	}
</style>
