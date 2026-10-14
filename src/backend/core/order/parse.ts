import { XMLParser } from 'fast-xml-parser'

import { fromXml } from '#backend/core/address/fias.ts'
import type { OrderTitles } from '#backend/core/order/read-input.ts'
import { KND_FORWARDING_ORDER } from '#backend/core/request/constants.ts'
import type { FiasAddress } from '#shared/address.ts'
import type { ForwardingOrder, Organization, PersonName, Signatory } from '#shared/order.ts'

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@',
	parseAttributeValue: false,
	trimValues: true,
})

/**
 * Разобранный XML: атрибуты лежат под «@Имя», вложенные элементы — под своим тегом.
 * Повторяющийся элемент парсер отдаёт массивом, одиночный — объектом.
 */
type NodeValue = string | number | Node | Node[] | undefined
type Node = {
	[key: string]: NodeValue
}

const EMPTY: Node = {}

/** Спуск по дереву. Чего нет — то пустой узел: разбирать приходится и неполные поручения. */
function at(node: NodeValue, ...path: string[]): Node {
	let current: NodeValue = node

	for (const key of path) {
		if (!current || typeof current !== 'object') return EMPTY

		current = Array.isArray(current) ? current[0]?.[key] : current[key]
	}

	if (!current || typeof current !== 'object') return EMPTY

	return Array.isArray(current) ? (current[0] ?? EMPTY) : current
}

function attr(node: Node, name: string): string | undefined {
	const value = node[`@${name}`]

	return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined
}

/** Есть ли под этим ключом хоть что-то: отличает пустой узел от настоящего. */
const present = (node: Node) => Object.keys(node).length > 0

/**
 * Заявке нужен ФИАС, но 1С шлёт адрес строкой в АдрИнф.
 *
 * Разобрать строку в ФИАС мы не можем, поэтому возвращаем её текстом: оператор
 * увидит адрес в сводке и найдёт ФИАС через поиск. Падать тут нельзя.
 */
function parseAddress(address: Node): FiasAddress {
	const gar = at(address, 'АдрГАР')
	const fias = present(gar) ? gar : at(address, 'АдрФИАС')

	if (present(fias)) return fromXml(fias)

	const text = attr(at(address, 'АдрИнф'), 'АдрТекст') ?? attr(at(address, 'АдрРФ'), 'Улица')

	return text ? { text } : {}
}

function parseOrg(info: Node): Organization {
	const org = at(info, 'ИдСв', 'СвЮЛУч')

	if (!present(org)) throw new Error('В поручении ожидается организация (СвЮЛУч).')

	return {
		name: attr(org, 'НаимОрг'),
		inn: attr(org, 'ИННЮЛ'),
		kpp: attr(org, 'КПП'),
		ogrn: attr(org, 'ОГРН'),
	}
}

function parseName(name: Node): PersonName | undefined {
	if (!present(name)) return undefined

	return {
		lastName: attr(name, 'Фамилия'),
		firstName: attr(name, 'Имя'),
		middleName: attr(name, 'Отчество'),
	}
}

/**
 * ИдФайл ФНС: ON_{форма}_{получатель}_{отправитель}_{версия}_{дата}_{uuid}.
 * Получатель поручения — это мы, и в заявке наш ящик становится отправителем.
 */
function parseFileId(fileId?: string) {
	const [, , recipient] = (fileId ?? '').split('_')

	return { senderBox: recipient }
}

/** Титул экспедитора необязателен, но именно из него берётся подписант заявки. */
function parseForwarderTitle(xml: string): Signatory | undefined {
	const signature = at(parser.parse(xml) as Node, 'Файл', 'Документ', 'ПодпИнфЭксп')

	if (!present(signature)) return undefined

	return {
		authorityKind: attr(signature, 'СпосПодтПолном'),
		position: attr(signature, 'Должн'),
		name: parseName(at(signature, 'ФИО')),
	}
}

export function parseForwardingOrder({ client, forwarder }: OrderTitles): ForwardingOrder {
	const file = at(parser.parse(client) as Node, 'Файл')
	const document = at(file, 'Документ')
	const knd = attr(document, 'КНД')

	if (knd !== KND_FORWARDING_ORDER) {
		throw new Error(
			`Ожидался титул клиента поручения экспедитору (КНД ${KND_FORWARDING_ORDER}), ` +
				`а получен КНД ${knd ?? '—'}.`,
		)
	}

	const content = at(document, 'СодИнфКлнт')
	const cargo = at(content, 'СвГруз')
	const cargoInfo = at(cargo, 'ОпГруз')
	const weight = present(at(cargoInfo, 'ВесГруз')) ? at(cargoInfo, 'ВесГруз') : at(cargo, 'ВесГрузПарт')

	return {
		...parseFileId(attr(file, 'ИдФайл')),
		number: attr(content, 'НомДок'),
		date: attr(content, 'ДатаДок'),
		dates: {
			shipmentFrom: attr(cargo, 'ДатОтгрС'),
			shipmentTo: attr(cargo, 'ДатОтгрПо'),
			deliveryFrom: attr(cargo, 'ДатДостГрС'),
			deliveryTo: attr(cargo, 'ДатДостГрПо'),
		},
		client: parseOrg(at(content, 'СвКлнт')),
		forwarder: parseOrg(at(content, 'СвЭксп')),
		forwarderAddress: parseAddress(at(content, 'СвЭксп', 'Адрес')),
		consignor: parseOrg(at(cargo, 'СвГО')),
		cargo: {
			name: attr(cargoInfo, 'НаимГруз'),
			packageCount: attr(cargoInfo, 'КолМестГр'),
			grossWeight: attr(weight, 'ВесБрутто'),
			// Объём в поручении необязателен: без УказОбъем=1 значения там нет.
			volume: attr(cargoInfo, 'УказОбъем') === '1' ? attr(cargoInfo, 'Объем') : undefined,
		},
		vehicle: { bodyType: attr(at(cargo, 'СвТС'), 'ТипКузов') },
		loadingAddress: parseAddress(at(cargo, 'АдрГруз', 'АдрПриемГруз', 'Адрес')),
		unloadingAddress: parseAddress(at(cargo, 'АдрПунктНазн', 'АдрВыдГруз', 'Адрес')),
		...(forwarder ? { signatory: parseForwarderTitle(forwarder) } : {}),
	}
}
