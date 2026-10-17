<script lang="ts">
	import '@aimuzov-projects/infra-site-kit/theme-peek.css'
	import Moon from '@lucide/svelte/icons/moon'
	import Sun from '@lucide/svelte/icons/sun'
	import SunMoon from '@lucide/svelte/icons/sun-moon'
	import { themePeek } from '@aimuzov-projects/infra-site-kit/theme-peek.js'
	import { onMount, tick } from 'svelte'

	import Button from '#frontend/components/ui/button.svelte'

	type Scheme = 'light' | 'dark'
	type Theme = 'system' | Scheme

	/** Ключ общий со скриптом public/theme.js: тот применяет выбор до отрисовки. */
	const KEY = 'theme'
	const VIEW = {
		system: { icon: SunMoon, label: 'как в системе' },
		light: { icon: Sun, label: 'светлая' },
		dark: { icon: Moon, label: 'тёмная' },
	}
	const ACTION: Record<Scheme, string> = { light: 'Включить светлую тему', dark: 'Включить тёмную тему' }
	/** Отступ подсказки от края экрана. */
	const EDGE = 8

	/** Убрать из Tab: в мастере клавиатурой ходят только по полям формы. */
	let { skipTab = false }: { skipTab?: boolean } = $props()

	let theme = $state<Theme>('system')
	let system = $state<Scheme>('light')
	const view = $derived(VIEW[theme])
	/**
	 * Клик всегда переворачивает видимую схему, как и круг themePeek при наведении.
	 * Иначе из "как в системе" можно попасть в ту же схему, и клик выглядит пустым.
	 */
	const next = $derived<Scheme>((theme === 'system' ? system : theme) === 'dark' ? 'light' : 'dark')
	const action = $derived(theme !== 'system' && next === system ? 'Вернуть тему как в системе' : ACTION[next])
	const tipId = $props.id()

	let anchor: HTMLElement | undefined
	let tip: HTMLElement

	// На сервере document нет: выбор, уже применённый public/theme.js, читаем в браузере.
	onMount(() => {
		const stored = document.documentElement.dataset.theme

		if (stored === 'light' || stored === 'dark') theme = stored

		const media = matchMedia('(prefers-color-scheme: dark)')
		const sync = () => (system = media.matches ? 'dark' : 'light')

		sync()
		media.addEventListener('change', sync)

		return () => media.removeEventListener('change', sync)
	})

	function cycle() {
		// Попали в системную схему: снова следуем системе, а не фиксируем её.
		theme = next === system ? 'system' : next
		const root = document.documentElement

		if (theme === 'system') delete root.dataset.theme
		else root.dataset.theme = theme

		try {
			if (theme === 'system') localStorage.removeItem(KEY)
			else localStorage.setItem(KEY, theme)
		} catch {
			// Хранилище закрыто (приватный режим) — тема продержится до перезагрузки.
		}

		// Текст подсказки сменился вместе с темой, ширина с ним: центруем заново.
		tick().then(place)
	}

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
	onclick={cycle}
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
