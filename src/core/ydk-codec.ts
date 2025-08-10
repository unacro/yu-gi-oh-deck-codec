import type { IYuGiOhDeckCodec, YuGiOhDeck } from "./utils";

class YdkCodec implements IYuGiOhDeckCodec {
	decode(ydkCode: string) {
		const lines = ydkCode.replaceAll("\r\n", "\n").split("\n");
		const deckList: Record<keyof YuGiOhDeck, number[]> = {
			main: [],
			extra: [],
			side: [],
		};
		const cursorTypeMap: Map<string, keyof YuGiOhDeck> = new Map([
			["#main", "main"],
			["#extra", "extra"],
			["!side", "side"],
		]);
		const deckName: string[] = [];
		let cursorType: keyof YuGiOhDeck = "main";
		for (const line of lines) {
			const text = line.trim();
			if (text === "") {
				continue;
			}
			if (text.startsWith("#") || text.startsWith("!")) {
				if (cursorTypeMap.has(text)) {
					cursorType = cursorTypeMap.get(text) ?? cursorType;
				} else if (deckName.length === 0) {
					deckName.push(text.slice(1).trim());
				}
				continue;
			}
			const cardPassword = Number.parseInt(text);
			if (Number.isNaN(cardPassword) || cardPassword <= 0) {
				continue;
			}
			deckList[cursorType].push(cardPassword);
		}
		return {
			data: {
				main: new Uint32Array(deckList.main),
				extra: new Uint32Array(deckList.extra),
				side:
					deckList.side.length > 0 ? new Uint32Array(deckList.side) : undefined,
			},
			name: deckName.pop() ?? "YDK Deck",
		};
	}

	encode(deckData: YuGiOhDeck, deckName: string = "") {
		const lines = [
			deckName === "" ? undefined : `# ${deckName}`,
			"#main",
			...deckData.main,
			"#extra",
			...deckData.extra,
			deckData.side ? "!side" : undefined,
			...(deckData.side ?? []),
		];
		return lines.filter((line) => line && line !== "").join("\n");
	}
}

export { YdkCodec };
