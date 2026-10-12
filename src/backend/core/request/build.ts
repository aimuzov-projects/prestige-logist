import { addressNode } from '#backend/core/address/fias.ts'
import {
	CARGO_DEFAULTS,
	CARRIAGE_TERMS,
	FOOD_CARRIAGE,
	FORM_VERSION,
	FUNCTION,
	KND_CARRIAGE_REQUEST,
	OPERATION_CONTENT,
	PACKAGE_SIZE_DEFAULTS,
	PROGRAM_VERSION,
	RUSSIA_COUNTRY_CODE,
	TIME_AGREED,
	VEHICLE_DEFAULTS,
} from '#backend/core/request/constants.ts'
import {
	dateTime,
	fnsDate,
	fnsTime,
	loadingType,
	requestFileId,
	toCompactDate,
	toGuillemets,
} from '#backend/core/request/format.ts'
import { offsetByAddress } from '#backend/core/timezone.ts'
import { el, serialize, textEl, type XmlNode } from '#backend/core/xml/serialize.ts'
import type { ForwardingOrder, PersonName } from '#shared/order.ts'
import { DEFAULT_TIME, type Carrier, type RequestInput } from '#shared/request.ts'

const LOADING_POINT = '1'
const UNLOADING_POINT = '2'

/** Пустой <ФИО /> в заявке лишний: у подписи по сертификату имени нет вовсе. */
function personName(name?: PersonName): XmlNode[] {
	const node = el('ФИО', {
		Фамилия: name?.lastName,
		Имя: name?.firstName,
		Отчество: name?.middleName,
	})
	return Object.keys(node.attrs).length ? [node] : []
}

function forwarderNode(order: ForwardingOrder, input: RequestInput) {
	const { inn, kpp } = order.forwarder
	return el('СвГО', {}, [
		el('ИдСв', {}, [el('СвЮЛУч', { НаимОрг: input.forwarder.fullName, ИННЮЛ: inn, КПП: kpp })]),
		addressNode(input.forwarder.address, { countryCode: RUSSIA_COUNTRY_CODE }),
	])
}

function carrierNode(carrier: Carrier) {
	const details =
		carrier.kind === 'ЮЛ'
			? el('СвЮЛУч', {
					НаимОрг: carrier.name,
					ИННЮЛ: carrier.inn,
					КПП: carrier.kpp,
					ОГРН: carrier.ogrn,
				})
			: el('СвИП', { ИННФЛ: carrier.inn, ОГРНИП: carrier.ogrnip }, [
					el('ФИО', {
						Фамилия: carrier.lastName,
						Имя: carrier.firstName,
						Отчество: carrier.middleName,
					}),
				])

	return el('СвПрв', {}, [
		el('ИдСв', {}, [details]),
		addressNode(carrier.address),
		...(carrier.phone ? [el('Конт', {}, [textEl('Тлф', carrier.phone)])] : []),
	])
}

function cargoNode(order: ForwardingOrder, input: RequestInput) {
	const packageCount = order.cargo.packageCount

	return el(
		'ОпГруз',
		{
			НаимГруз: order.cargo.name,
			СостГруз: CARGO_DEFAULTS.condition,
			Объем: order.cargo.volume ?? CARGO_DEFAULTS.volume,
			ВидТар: input.packageKind,
			КолГрМест: packageCount,
			МетОпрМасс: CARGO_DEFAULTS.weighingMethod,
			РаспрГр: CARGO_DEFAULTS.distribution,
			ДелГр: CARGO_DEFAULTS.divisible,
		},
		[
			el('МасГруз', { МасБрутЗнач: order.cargo.grossWeight }),
			el('РазмерГрМест', {
				ВысЗнач: PACKAGE_SIZE_DEFAULTS.height,
				ДлЗнач: PACKAGE_SIZE_DEFAULTS.length,
				ШирЗнач: PACKAGE_SIZE_DEFAULTS.width,
			}),
			el('Пункт', { Погр: LOADING_POINT, Выгр: UNLOADING_POINT, КолГрМест: packageCount }),
		].filter((node) => Object.keys(node.attrs).length),
	)
}

export type BuildOptions = {
	uuid?: string
	encoding?: string
}

export function buildCarriageRequest(
	order: ForwardingOrder,
	input: RequestInput,
	{ uuid = crypto.randomUUID(), encoding }: BuildOptions = {},
): string {
	const issuedAt = input.issuedAt ?? new Date()
	const issueDate = fnsDate(issuedAt)
	const { loadingAddress, unloadingAddress } = input
	// Пояс считаем от адреса, который реально попадёт в заявку: оператор мог его поправить.
	const loadingOffset = offsetByAddress(loadingAddress)
	const unloadingOffset = offsetByAddress(unloadingAddress)
	const placementTime = dateTime(input.loadingDate, DEFAULT_TIME, loadingOffset)

	const content = el(
		'СодИнфГО',
		{
			СодОпер: OPERATION_CONTENT,
			НомЗак: input.orderNumber,
			ДатаЗак: order.date,
			УкНормПрвз: CARRIAGE_TERMS,
			ПрвзПищПрод: FOOD_CARRIAGE,
		},
		[
			forwarderNode(order, input),
			carrierNode(input.carrier),
			el('ПунктПод', { ДатВрПод: placementTime, НалКоорТочВрПод: TIME_AGREED }, [
				el('АдрПунктПод', {}, [addressNode(loadingAddress)]),
			]),
			el(
				'АдрПункт',
				{
					Опер: 'Погрузка',
					ПорНомПункт: LOADING_POINT,
					ДатВрОпер: placementTime,
					НалКоорТочВрОпер: TIME_AGREED,
				},
				[
					el('АдресПункт', {}, [addressNode(loadingAddress)]),
					el('ОргВладИнфр', {
						НаимВладИнфр: toGuillemets(order.consignor.name),
						ИННВладИнфр: order.consignor.inn,
					}),
				],
			),
			el(
				'АдрПункт',
				{
					Опер: 'Выгрузка',
					ПорНомПункт: UNLOADING_POINT,
					ДатВрОпер: dateTime(input.unloadingDate, DEFAULT_TIME, unloadingOffset),
					НалКоорТочВрОпер: TIME_AGREED,
				},
				[el('АдресПункт', {}, [addressNode(unloadingAddress)])],
			),
			cargoNode(order, input),
			el('ПарТСПрвз', {
				Тип: VEHICLE_DEFAULTS.type,
				Грузопод: VEHICLE_DEFAULTS.capacity,
				Вместим: VEHICLE_DEFAULTS.volume,
				ТипПогр: loadingType(order.vehicle.bodyType),
			}),
		],
	)

	const document = el(
		'Документ',
		{
			КНД: KND_CARRIAGE_REQUEST,
			ДатИнфГО: issueDate,
			ВрИнфГО: fnsTime(issuedAt),
			НаимЭкСубСост: composerName(order, input),
			Функция: FUNCTION,
		},
		[
			content,
			el(
				'ПодпИнфГО',
				{
					СпосПодтПолном: input.signatory?.authorityKind,
					Должн: input.signatory?.position,
				},
				personName(input.signatory?.name),
			),
		],
	)

	const file = el(
		'Файл',
		{
			ИдФайл: requestFileId({
				recipientBox: input.carrier.edmBox,
				senderBox: order.senderBox,
				date: toCompactDate(issueDate),
				uuid,
			}),
			ВерсПрог: PROGRAM_VERSION,
			ВерсФорм: FORM_VERSION,
		},
		[document],
	)

	return serialize(file, encoding ? { encoding } : {})
}

/** Диадок пишет составителя строкой «Наименование, ИНН …, КПП …». */
function composerName(order: ForwardingOrder, input: RequestInput): string {
	const { inn, kpp } = order.forwarder
	return `${input.forwarder.fullName}, ИНН ${inn}, КПП ${kpp}`
}
