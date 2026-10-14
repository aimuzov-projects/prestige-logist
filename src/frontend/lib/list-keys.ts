/**
 * Клавиатура для списков вариантов под полем поиска (адреса, тара). Варианты доступны
 * по Tab, а стрелками быстрее: из поля стрелкой вниз в список, по нему стрелками,
 * выбор Enter, Escape — обратно в поле.
 */

const options = (list: Element | null | undefined) => [...(list?.querySelectorAll<HTMLElement>('button') ?? [])]

/** На поле: стрелка вниз уводит к первому варианту списка. */
export function enterList(event: KeyboardEvent, list: Element | null | undefined) {
	if (event.key !== 'ArrowDown') return

	const first = options(list)[0]

	if (!first) return

	event.preventDefault()
	first.focus()
}

/** На варианте: стрелки — по списку, вверх с первого и Escape — обратно в поле. */
export function moveInList(event: KeyboardEvent, input: HTMLElement | null | undefined) {
	const current = event.currentTarget as HTMLElement
	const items = options(current.closest('ul'))
	const index = items.indexOf(current)
	const target =
		event.key === 'ArrowDown'
			? items[index + 1]
			: event.key === 'ArrowUp'
				? (items[index - 1] ?? input)
				: event.key === 'Escape'
					? input
					: undefined

	if (!target) return

	event.preventDefault()
	target.focus()
}
