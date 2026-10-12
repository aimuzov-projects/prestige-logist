/** Константы перехода ПЭ (КНД 1110486) в заказ-заявку (КНД 1110361). */

export const KND_FORWARDING_ORDER = '1110486'
export const KND_CARRIAGE_REQUEST = '1110361'

export const FORM_VERSION = '5.01'
export const PROGRAM_VERSION = 'Diadoc 1.0'
export const REQUEST_PREFIX = 'ON_ZAKZVGO'

export const FUNCTION = 'Заказ'

/** Код России по ОКСМ. В заявке его ждут у своего адреса — у остальных он лишний. */
export const RUSSIA_COUNTRY_CODE = '643'

/** Оба реквизита в наших заявках всегда пустые, спрашивать их у оператора незачем. */
export const CARRIAGE_TERMS = 'Отсутствует'
export const FOOD_CARRIAGE = 'Отсутствует'
export const OPERATION_CONTENT = 'Предоставление заказа и заявки на перевозку груза автомобильным транспортом'

/**
 * Реквизиты, которые оператор не заполняет: у них одно значение на все заявки.
 *
 * Опустить их нельзя — эталоны выводят эти атрибуты всегда, пусть и нулями, а без
 * них принимающая сторона не разбирает и соседние поля.
 */
export const CARGO_DEFAULTS = {
	condition: 'новый',
	volume: '0',
	weighingMethod: '03',
	distribution: '0',
	divisible: '1',
} as const

export const PACKAGE_SIZE_DEFAULTS = { height: '0', length: '0', width: '0' } as const

export const VEHICLE_DEFAULTS = { type: 'Грузовой', capacity: '0', volume: '0' } as const

/** Согласование времени: во всех наших заявках стоит «1». */
export const TIME_AGREED = '1'

/** В поручении времён нет, только даты. Девять утра — то, с чем работает диспетчер. */
export const DEFAULT_TIME = '09:00:00'
