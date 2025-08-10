import type { IYuGiOhDeckCodec, YuGiOhDeck } from "../core/utils";
import utils from "../core/utils";

class UntappedCodec implements IYuGiOhDeckCodec {
	#getCardPasswordFromBase64(deckCode: string) {
		if (deckCode === "") {
			return undefined;
		}
		const deckBase64 = [
			deckCode.replace(/-/g, "+").replace(/_/g, "/"),
			"=".repeat((4 - (deckCode.length % 4)) % 4),
		].join("");
		const binaryData = utils.isNodeRuntime()
			? Uint8Array.from(Buffer.from(deckBase64, "base64")) // Node.js
			: Uint8Array.from(atob(deckBase64), (c) => c.charCodeAt(0)); // Browser & Node.js
		console.log({
			binaryData,
			length: binaryData.length,
			// "32bit": new Uint32Array(binaryData.buffer),
		});

		const debug = (startIndex: number, length: number) => {
			const slice = [...binaryData.slice(startIndex, startIndex + length)];
			// const cardPassword = Number.parseInt(
			// 	slice.map((b) => b.toString(2)).join(""),
			// 	2,
			// ).toString();
			const cardPassword = Number.parseInt(
				slice.map((b) => b.toString(2)).join(""),
				2,
			).toString();
			console.log(
				`${startIndex} ~ ${startIndex + length - 1}: https://ygocdb.com/card/${cardPassword}`,
			);
			fetch(`https://ygocdb.com/api/v0/?search=${cardPassword}`)
				.then((response) => response.json())
				.then((response) =>
					console.log({
						cardPassword,
						queryCount: response.result.length,
						cardName: response.result?.[0]?.md_name,
						cardData: response.result?.[0],
					}),
				);
		};
		const start = 22;
		for (let i = start; i < start + 10; i++) {
			debug(i, 4);
		}
		return [...binaryData].map((b) => b.toString(2));
	}

	decode(untappedCode: string) {
		const [deckCode, deckName] = untappedCode.split(";");
		if (!deckCode) {
			return {
				data: {
					main: new Uint32Array(),
					extra: new Uint32Array(),
				},
				name: "error: parse untapped.gg code failed",
			};
		}
		console.log({ deckCode, length: deckCode.length, deckName });
		console.log({
			rawBytes: this.#getCardPasswordFromBase64(deckCode),
		});
		console.log({
			"93039339": (93039339).toString(2).replace(/\B(?=(\d{8})+$)/g, " "),
			"12435193": (12435193).toString(2).replace(/\B(?=(\d{8})+$)/g, " "),
		});
		return {
			data: {
				main: new Uint32Array([89631139]),
				extra: new Uint32Array([]),
			},
			name: deckName ?? "Untapped.gg Deck",
		};

		// TODO: base64 解码 untappedCode
	}

	encode(deckData: YuGiOhDeck, deckName: string = ""): string {
		console.error({ deckName, deckData });
		throw new Error("Method not implemented");
		// return "";
	}
}

export { UntappedCodec };
