/**
 * Единое представление адреса — плоский объект, он же формат полей формы.
 *
 * АдрГАР поручения и АдрФИАС заявки отличаются только именем корня и наличием
 * НаимРегион, поэтому читаем и пишем их одной схемой.
 */

export type AddressPart = {
	kind?: string
	kindCode?: string
	type?: string
	name?: string
	number?: string
}

export type FiasAddress = {
	fiasId?: string
	postalCode?: string
	region?: string
	municipalDistrict?: AddressPart
	settlementArea?: AddressPart
	locality?: AddressPart
	planningStructure?: AddressPart
	street?: AddressPart
	buildings?: AddressPart[]
	premises?: AddressPart[]
	/** Адрес одной строкой: 1С шлёт его вместо ФИАС, в заявку такой не годится. */
	text?: string
}

/** Ключ нашей модели против имени атрибута ФНС внутри элемента адреса. */
type PartMap = Partial<Record<keyof AddressPart, string>>

export type AddressLevel = {
	key: keyof FiasAddress
	element: string
	label: string
	parts?: PartMap
	partLabels?: Partial<Record<keyof AddressPart, string>>
	many?: boolean
}

const KIND_AND_NAME = { kindCode: 'Код вида', name: 'Наименование' }

/** Уровни адреса в порядке XSD-sequence заявки. */
export const ADDRESS_LEVELS: AddressLevel[] = [
	{ key: 'region', element: 'Регион', label: 'Код региона' },
	{
		key: 'municipalDistrict',
		element: 'МуниципРайон',
		label: 'Муниципальный район',
		parts: { kindCode: 'ВидКод', name: 'Наим' },
		partLabels: KIND_AND_NAME,
	},
	{
		key: 'settlementArea',
		element: 'ГородСелПоселен',
		label: 'Городское/сельское поселение',
		parts: { kindCode: 'ВидКод', name: 'Наим' },
		partLabels: KIND_AND_NAME,
	},
	{
		key: 'locality',
		element: 'НаселенПункт',
		label: 'Населённый пункт',
		parts: { kind: 'Вид', name: 'Наим' },
		partLabels: { kind: 'Вид', name: 'Наименование' },
	},
	{
		key: 'planningStructure',
		element: 'ЭлПланСтруктур',
		label: 'Элемент планировочной структуры',
		parts: { type: 'Тип', name: 'Наим' },
		partLabels: { type: 'Тип', name: 'Наименование' },
	},
	{
		key: 'street',
		element: 'ЭлУлДорСети',
		label: 'Улица',
		parts: { type: 'Тип', name: 'Наим' },
		partLabels: { type: 'Тип', name: 'Наименование' },
	},
	{
		key: 'buildings',
		element: 'Здание',
		label: 'Здание',
		parts: { type: 'Тип', number: 'Номер' },
		partLabels: { type: 'Тип', number: 'Номер' },
		many: true,
	},
	{
		key: 'premises',
		element: 'ПомещЗдания',
		label: 'Помещение',
		parts: { type: 'Тип', number: 'Номер' },
		partLabels: { type: 'Тип', number: 'Номер' },
		many: true,
	},
]

/** Описание подполей адреса для формы: ключ, подпись, вложенные поля, повторяемость. */
export const ADDRESS_FIELDS = ADDRESS_LEVELS.map(({ key, label, partLabels, many }) => ({
	key,
	label,
	parts: partLabels && Object.entries(partLabels).map(([name, partLabel]) => ({ name, label: partLabel })),
	many: Boolean(many),
}))

/** Текстовый адрес из 1С в ФИАС не превратить — он живёт только в сводке. */
export const isTextOnly = (address?: FiasAddress) => Boolean(address?.text)

/** «д» и «д.» приходят вперемешку: из поручения с точкой, из справочника без. */
const abbr = (type?: string) => `${type?.replace(/\.$/, '')}.`

export function addressToText(address: FiasAddress = {}): string {
	if (address.text) return address.text
	const parts = [
		address.postalCode,
		address.municipalDistrict?.name,
		address.locality && `${address.locality.kind} ${address.locality.name}`,
		address.street && `${address.street.type} ${address.street.name}`,
		...(address.buildings ?? []).map((b) => `${abbr(b.type)} ${b.number}`),
		...(address.premises ?? []).map((p) => `${abbr(p.type)} ${p.number}`),
	]
	return parts.filter(Boolean).join(', ')
}
