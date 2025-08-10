import type { IYuGiOhDeckCodec, YuGiOhDeck } from "./utils";
import utils from "./utils";

class YdkeCodec implements IYuGiOhDeckCodec {
	#protocolPrefix = "ydke://" as const;
	#splitter = "!" as const;

	#getCardPasswordFromBase64(cardsBase64: string) {
		if (cardsBase64 === "") {
			return undefined;
		}
		const binaryData = utils.isNodeRuntime()
			? Uint8Array.from(Buffer.from(cardsBase64, "base64")) // Node.js
			: Uint8Array.from(atob(cardsBase64), (c) => c.charCodeAt(0)); // Browser & Node.js
		return new Uint32Array(binaryData.buffer);
	}

	#getBase64FromCardPassword(cardsData: Uint32Array) {
		if (cardsData.length === 0) {
			return "";
		}
		const binaryData = new Uint8Array(cardsData.buffer);
		return utils.isNodeRuntime()
			? Buffer.from(binaryData).toString("base64")
			: btoa(String.fromCharCode(...binaryData)); // 引擎的函数参数有数量限制
		// : Array.from(binaryData).map((byte) => String.fromCharCode(byte)).join(""); // 兼容无限长度数据
	}

	#normalizeCode(ydkeCode: string) {
		if (!ydkeCode.startsWith(this.#protocolPrefix)) {
			console.warn(`Invalid ydke code: ${ydkeCode}`);
			return [];
		}
		const cardsList = [];
		const regex = /(?<cards>[0-9A-Za-z+/=]+)!/y;
		regex.lastIndex = this.#protocolPrefix.length;
		while (regex.lastIndex < ydkeCode.length) {
			const matched = regex.exec(ydkeCode);
			if (!matched) {
				break;
			}
			cardsList.push(matched.groups?.cards);
			regex.lastIndex = matched.index + matched[0].length;
		}
		return cardsList;
	}

	decode(ydkeCode: string): { data: YuGiOhDeck; name: string } {
		const [main, extra, side] = this.#normalizeCode(ydkeCode);
		if (!main || !extra) {
			return {
				data: {
					main: new Uint32Array(),
					extra: new Uint32Array(),
				},
				name: "error: parse ydke code failed",
			};
		}
		return {
			data: {
				main: this.#getCardPasswordFromBase64(main) as Uint32Array,
				extra: this.#getCardPasswordFromBase64(extra) as Uint32Array,
				side: this.#getCardPasswordFromBase64(side ?? ""),
			},
			name: "YDKE Deck",
		};
	}

	encode(deckData: YuGiOhDeck): string {
		return [
			this.#protocolPrefix,
			this.#getBase64FromCardPassword(deckData.main),
			this.#splitter,
			this.#getBase64FromCardPassword(deckData.extra),
			this.#splitter,
			this.#getBase64FromCardPassword(deckData.side ?? new Uint32Array()),
			this.#splitter,
		].join("");
	}
}

export { YdkeCodec };
