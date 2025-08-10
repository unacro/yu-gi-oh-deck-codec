import type { YuGiOhDeck } from "./utils";

type YgocdbApiCardData = {
	cid: number;
	id: number;
	cn_name: string;
	sc_name: string;
	md_name?: string;
	nwbbs_n: string;
	cnocg_n: string;
	jp_ruby: string;
	jp_name: string;
	en_name: string;
	text: {
		types: string;
		pdesc: string;
		desc: string;
	};
	data: {
		ot: number;
		setcode: number;
		type: number;
		atk: number;
		def: number;
		level: number;
		race: number;
		attribute: number;
	};
	html: {
		pdesc: string;
		desc: string;
		refer: object;
	};
	weight: number;
	faqs: string[];
	artid: number;
};

type YgocdbApiResponse = {
	result: YgocdbApiCardData[];
	next: number;
};

class YgoDeckRenderer {
	#fetchCache: Map<number, Promise<YgocdbApiResponse>>;

	constructor() {
		this.#fetchCache = new Map();
	}

	#fetchRemoteCardData(cardPassword: number): Promise<YgocdbApiResponse> {
		if (this.#fetchCache.has(cardPassword)) {
			return this.#fetchCache.get(cardPassword) as Promise<YgocdbApiResponse>;
		}
		const promisedRequest = fetch(
			`https://ygocdb.com/api/v0/?search=${cardPassword}`,
		)
			.then((response) => response.json())
			.finally(() => {
				// 设置过期时间 到期重新请求?
				// this.#fetchCache.delete(cardPassword);
			});
		this.#fetchCache.set(cardPassword, promisedRequest);
		return promisedRequest;
	}

	#renderCards(cards: Uint32Array, cardsType: string = "main") {
		const cardsElement = document.createElement("div");
		cardsElement.dataset.ygoCardsType = cardsType;
		for (let i = 0; i < cards.length; i++) {
			const cardPassword = cards[i];
			if (!cardPassword) {
				continue;
			}
			const cardElement = document.createElement("div");
			cardElement.dataset.ygoCardPassword = cardPassword.toString();
			this.#fetchRemoteCardData(cardPassword).then((response) => {
				const { result } = response;
				const cardData = result?.[0];
				if (!cardData) {
					return;
				}
				const cardMasterDuelName = cardData?.md_name;
				cardElement.dataset.ygoCardName = cardMasterDuelName ?? "unknown";
				cardElement.title = [
					"Yu-Gi-Oh! Card",
					cardPassword,
					cardMasterDuelName ?? cardData.sc_name ?? cardData.cn_name,
					cardData.jp_name,
					cardData.en_name,
				]
					.filter(Boolean)
					.join("\n");
			});
			const cardImageElement = document.createElement("img");
			cardImageElement.src = `https://cdn.233.momobako.com/ygopro/pics/${cardPassword}.jpg!half`;
			cardImageElement.srcset = [
				`https://images.ygoprodeck.com/images/cards_small/${cardPassword}.jpg 1x`,
				`https://images.ygoprodeck.com/images/cards/${cardPassword}.jpg 2x`,
			].join(", ");
			cardImageElement.alt = `Yu-Gi-Oh! Card ${cardPassword}`;
			cardElement.appendChild(cardImageElement);
			cardsElement.appendChild(cardElement);
		}
		return cardsElement;
	}

	render(
		deckData: YuGiOhDeck,
		deckName: string = "Untitled Deck",
		deckCode: string = "",
	): HTMLDivElement {
		const deckContainerElement = document.createElement("div");
		deckContainerElement.dataset.ygoDeck = deckName;
		const deckNameElement = document.createElement("span");
		deckNameElement.innerText = deckName;
		deckNameElement.dataset.ygoDeckName = deckName;
		if (deckCode && deckCode !== "") {
			const deckCodeLines = deckCode.split("\n");
			const maxLineCountLimit = 61; // main 40 + extra 15 + side 1 + title 3 + meta 2
			deckNameElement.title =
				deckCodeLines.length > maxLineCountLimit
					? [...deckCodeLines.slice(0, maxLineCountLimit), "......"].join("\n")
					: deckCode;
		}
		const mainTitleElement = document.createElement("span");
		mainTitleElement.innerText = `主牌组(${deckData.main.length})`;
		mainTitleElement.dataset.ygoCardsType = "main";
		const extraTitleElement = document.createElement("span");
		extraTitleElement.innerText = `额外牌组(${deckData.extra.length})`;
		extraTitleElement.dataset.ygoCardsType = "extra";
		deckContainerElement.append(
			deckNameElement,
			mainTitleElement,
			this.#renderCards(deckData.main, "main"),
			extraTitleElement,
			this.#renderCards(deckData.extra, "extra"),
		);
		if (deckData.side?.length && deckData.side.length > 0) {
			const sideTitleElement = document.createElement("span");
			sideTitleElement.innerText = `副牌组(${deckData.side.length})`;
			sideTitleElement.dataset.ygoCardsType = "side";
			deckContainerElement.append(
				sideTitleElement,
				this.#renderCards(deckData.side, "side"),
			);
		}
		return deckContainerElement;
	}
}

export default YgoDeckRenderer;
