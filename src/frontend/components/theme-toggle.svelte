<script lang="ts">
	import Monitor from '@lucide/svelte/icons/monitor'
	import Moon from '@lucide/svelte/icons/moon'
	import Sun from '@lucide/svelte/icons/sun'
	import { onMount } from 'svelte'

	import Button from '#frontend/components/ui/button.svelte'

	type Theme = 'system' | 'light' | 'dark'

	/** Ключ общий со скриптом public/theme.js: тот применяет выбор до отрисовки. */
	const KEY = 'theme'
	const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
	const VIEW = {
		system: { icon: Monitor, label: 'как в системе' },
		light: { icon: Sun, label: 'светлая' },
		dark: { icon: Moon, label: 'тёмная' },
	}

	let theme = $state<Theme>('system')
	const view = $derived(VIEW[theme])

	// На сервере document нет: выбор, уже применённый public/theme.js, читаем в браузере.
	onMount(() => {
		const stored = document.documentElement.dataset.theme
		if (stored === 'light' || stored === 'dark') theme = stored
	})

	function cycle() {
		theme = NEXT[theme]
		const root = document.documentElement
		if (theme === 'system') delete root.dataset.theme
		else root.dataset.theme = theme
		try {
			if (theme === 'system') localStorage.removeItem(KEY)
			else localStorage.setItem(KEY, theme)
		} catch {
			// Хранилище закрыто (приватный режим) — тема продержится до перезагрузки.
		}
	}
</script>

<Button
	variant="ghost"
	size="lg"
	aria-label={`Тема: ${view.label}. Переключить`}
	title={`Тема: ${view.label}`}
	onclick={cycle}
>
	<view.icon size={16} />
</Button>
