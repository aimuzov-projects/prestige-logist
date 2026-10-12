import AdmZip from 'adm-zip'

import { decodeXml } from '#/core/xml/encoding.ts'

const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]

const startsWith = (buffer: Buffer, bytes: number[]) => bytes.every((byte, i) => buffer[i] === byte)

export type OrderTitles = {
	/** Титул клиента — из него берётся всё содержание поручения. */
	client: string
	/** Титул экспедитора, если он есть в комплекте: оттуда подписант заявки. */
	forwarder?: string
}

/**
 * Из архива «полного документооборота» нужны только два титула поручения.
 * Подтверждения оператора (DP_*), МЧД и подписи игнорируем.
 */
function extractFromZip(buffer: Buffer): OrderTitles {
	const entries = new AdmZip(buffer).getEntries().filter((entry) => !entry.isDirectory)
	const findXml = (prefix: string) =>
		entries.find((entry) => {
			const name = entry.entryName.split('/').pop() ?? ''
			return name.startsWith(prefix) && name.toLowerCase().endsWith('.xml')
		})

	const client = findXml('ON_POREXPKLT')
	if (!client) {
		throw new Error('В архиве нет титула клиента ON_POREXPKLT_*.xml — это не комплект поручения экспедитору.')
	}

	const forwarder = findXml('ON_POREXPEXP')
	return {
		client: decodeXml(client.getData()),
		forwarder: forwarder ? decodeXml(forwarder.getData()) : undefined,
	}
}

/** Принимает и zip комплекта, и одиночный XML титула клиента. */
export function readInput(buffer: Buffer): OrderTitles {
	if (startsWith(buffer, ZIP_SIGNATURE)) return extractFromZip(buffer)
	return { client: decodeXml(buffer) }
}
