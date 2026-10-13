<script lang="ts" module>
	import ArrowRight from '@lucide/svelte/icons/arrow-right'
	import Boxes from '@lucide/svelte/icons/boxes'
	import Building from '@lucide/svelte/icons/building-2'
	import Calendar from '@lucide/svelte/icons/calendar'
	import Download from '@lucide/svelte/icons/download'
	import Lightbulb from '@lucide/svelte/icons/lightbulb'
	import ListChecks from '@lucide/svelte/icons/list-checks'
	import MapPin from '@lucide/svelte/icons/map-pin'
	import Package from '@lucide/svelte/icons/package'
	import ShieldCheck from '@lucide/svelte/icons/shield-check'
	import Sparkles from '@lucide/svelte/icons/sparkles'
	import UserPen from '@lucide/svelte/icons/user-pen'

	/**
	 * Иконки для Astro-страниц. Сами компоненты lucide в .astro не типизируются,
	 * поэтому страница просит иконку по имени, а рисует её Svelte.
	 */
	const ICONS = {
		'arrow-right': ArrowRight,
		boxes: Boxes,
		building: Building,
		calendar: Calendar,
		download: Download,
		lightbulb: Lightbulb,
		'list-checks': ListChecks,
		'map-pin': MapPin,
		package: Package,
		'shield-check': ShieldCheck,
		sparkles: Sparkles,
		'user-pen': UserPen,
	}

	export type IconName = keyof typeof ICONS
</script>

<script lang="ts">
	let { name, size = 16, class: className }: { name: IconName; size?: number; class?: string } = $props()

	const Glyph = $derived(ICONS[name])
</script>

<Glyph {size} class={className} aria-hidden="true" />
