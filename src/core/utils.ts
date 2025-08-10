/**
 * @description 99,999,999 < 134,217,728(2^27)
 */
export interface YuGiOhDeck {
	main: Uint32Array;
	extra: Uint32Array;
	side?: Uint32Array;
}

export interface IYuGiOhDeckCodec {
	encode(deckData: YuGiOhDeck, deckName?: string): string;
	decode(deckCode: string): { data: YuGiOhDeck; name: string };
}

function getRuntimeEnvironment() {
	if (typeof window !== "undefined" && typeof window.document !== "undefined") {
		return "browser";
	}
	if (typeof process !== "undefined" && process.versions?.node) {
		return "node";
	}
	if (typeof require === "function" && typeof module !== "undefined") {
		return "node";
	}
	return "unknown";
}

const isNodeRuntime = (() => {
	let cachedResult: boolean | undefined;
	return (): boolean => {
		if (cachedResult === undefined) {
			cachedResult = getRuntimeEnvironment() === "node";
		}
		return cachedResult;
	};
})();

export default {
	getRuntimeEnvironment,
	isNodeRuntime,
};
