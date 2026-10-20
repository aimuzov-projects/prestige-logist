<script lang="ts">
	import History from '@lucide/svelte/icons/history'
	import Info from '@lucide/svelte/icons/info'

	type Props = {
		/** Путь текущей страницы: её значок горит, но никуда не ведёт. */
		current?: string
		/** Убрать из Tab: в мастере клавиатурой ходят только по полям формы. */
		skipTab?: boolean
	}

	let { current, skipTab = false }: Props = $props()

	const LINKS = [
		{ href: '/about', label: 'О сервисе', icon: Info },
		{ href: '/changelog', label: 'Что нового', icon: History },
	]
	/** Отступ подсказки от края экрана. */
	const EDGE = 8

	let open = $state<HTMLElement>()

	/**
	 * Подсказка в верхнем слое (popover), как у переключателя темы, иначе её накрыл бы его
	 * круг с другой темой. Там она вне раскладки, поэтому ставим её под значком сами.
	 */
	function show(event: Event) {
		const link = event.currentTarget as HTMLElement
		const tip = link.nextElementSibling as HTMLElement

		if (!tip.matches(':popover-open')) tip.showPopover()

		const rect = link.getBoundingClientRect()
		const limit = document.documentElement.clientWidth - EDGE - tip.offsetWidth

		tip.style.left = `${Math.max(EDGE, Math.min(rect.left + rect.width / 2 - tip.offsetWidth / 2, limit))}px`
		tip.style.top = `${rect.bottom + 6}px`
		open = tip
	}

	function hide() {
		if (open?.matches(':popover-open')) open.hidePopover()

		open = undefined
	}
</script>

{#each LINKS as link (link.href)}
	{@const here = current === link.href}
	<!-- На своей странице без href: Enter не перезагружает её, а Tab проходит мимо. Роль ссылки
	     оставляем, чтобы скринридер прочёл «текущая страница» в том же ряду -->
	<a
		class="corner-link"
		href={here ? undefined : link.href}
		role={here ? 'link' : undefined}
		aria-label={link.label}
		aria-current={here ? 'page' : undefined}
		aria-disabled={here ? 'true' : undefined}
		tabindex={skipTab ? -1 : undefined}
		onpointerenter={show}
		onpointerleave={hide}
		onfocus={show}
		onblur={hide}
	>
		<link.icon size={16} />
	</a>
	<!-- Подпись уже есть в aria-label ссылки: подсказка только для глаз -->
	<span class="corner-tip" aria-hidden="true" popover="manual">{link.label}</span>
{/each}

<svelte:window onscroll={hide} onresize={hide} onkeydown={(event) => event.key === 'Escape' && hide()} />

<style>
	/* Как кнопка темы рядом (ghost, lg), только квадратная и в покое приглушена. */
	.corner-link {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-sm);
		color: var(--muted);
		transition:
			background-color 0.15s,
			color 0.15s,
			box-shadow 0.15s;

		@media (--reduced-motion) {
			transition: none;
		}

		&:hover {
			color: var(--fg);
			background: var(--surface);
		}

		&:focus-visible {
			outline: none;
			box-shadow: 0 0 0 3px var(--ring);
		}

		/* Текущая страница: значок горит, но не кликается, ссылка на саму себя бесполезна. */
		&[aria-current='page'] {
			pointer-events: none;
			color: var(--fg);
		}
	}

	/* Внешний вид как у подсказки темы. Popover по умолчанию по центру экрана: сбрасываем. */
	.corner-tip {
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
