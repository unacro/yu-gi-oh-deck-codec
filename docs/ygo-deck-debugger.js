// src/core/html-renderer.ts
class YgoDeckRenderer {
  #fetchCache;
  constructor() {
    this.#fetchCache = new Map;
  }
  #fetchRemoteCardData(cardPassword) {
    if (this.#fetchCache.has(cardPassword)) {
      return this.#fetchCache.get(cardPassword);
    }
    const promisedRequest = fetch(`https://ygocdb.com/api/v0/?search=${cardPassword}`).then((response) => response.json()).finally(() => {});
    this.#fetchCache.set(cardPassword, promisedRequest);
    return promisedRequest;
  }
  #renderCards(cards, cardsType = "main") {
    const cardsElement = document.createElement("div");
    cardsElement.dataset.ygoCardsType = cardsType;
    for (let i = 0;i < cards.length; i++) {
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
          cardData.en_name
        ].filter(Boolean).join(`
`);
      });
      const cardImageElement = document.createElement("img");
      cardImageElement.src = `https://cdn.233.momobako.com/ygopro/pics/${cardPassword}.jpg!half`;
      cardImageElement.srcset = [
        `https://images.ygoprodeck.com/images/cards_small/${cardPassword}.jpg 1x`,
        `https://images.ygoprodeck.com/images/cards/${cardPassword}.jpg 2x`
      ].join(", ");
      cardImageElement.alt = `Yu-Gi-Oh! Card ${cardPassword}`;
      cardElement.appendChild(cardImageElement);
      cardsElement.appendChild(cardElement);
    }
    return cardsElement;
  }
  render(deckData, deckName = "Untitled Deck", deckCode = "") {
    const deckContainerElement = document.createElement("div");
    deckContainerElement.dataset.ygoDeck = deckName;
    const deckNameElement = document.createElement("span");
    deckNameElement.innerText = deckName;
    deckNameElement.dataset.ygoDeckName = deckName;
    if (deckCode && deckCode !== "") {
      const deckCodeLines = deckCode.split(`
`);
      const maxLineCountLimit = 61;
      deckNameElement.title = deckCodeLines.length > maxLineCountLimit ? [...deckCodeLines.slice(0, maxLineCountLimit), "......"].join(`
`) : deckCode;
    }
    const mainTitleElement = document.createElement("span");
    mainTitleElement.innerText = `主牌组(${deckData.main.length})`;
    mainTitleElement.dataset.ygoCardsType = "main";
    const extraTitleElement = document.createElement("span");
    extraTitleElement.innerText = `额外牌组(${deckData.extra.length})`;
    extraTitleElement.dataset.ygoCardsType = "extra";
    deckContainerElement.append(deckNameElement, mainTitleElement, this.#renderCards(deckData.main, "main"), extraTitleElement, this.#renderCards(deckData.extra, "extra"));
    if (deckData.side?.length && deckData.side.length > 0) {
      const sideTitleElement = document.createElement("span");
      sideTitleElement.innerText = `副牌组(${deckData.side.length})`;
      sideTitleElement.dataset.ygoCardsType = "side";
      deckContainerElement.append(sideTitleElement, this.#renderCards(deckData.side, "side"));
    }
    return deckContainerElement;
  }
}
var html_renderer_default = YgoDeckRenderer;

// src/core/utils.ts
function getRuntimeEnvironment() {
  if (typeof window !== "undefined" && typeof window.document !== "undefined") {
    return "browser";
  }
  if (typeof process !== "undefined" && process.versions?.node) {
    return "node";
  }
  if (typeof module_utils !== "undefined") {
    return "node";
  }
  return "unknown";
}
var isNodeRuntime = (() => {
  let cachedResult;
  return () => {
    if (cachedResult === undefined) {
      cachedResult = getRuntimeEnvironment() === "node";
    }
    return cachedResult;
  };
})();
var utils_default = {
  getRuntimeEnvironment,
  isNodeRuntime
};

// src/core/untapped-codec.ts
class UntappedCodec {
  #getCardPasswordFromBase64(deckCode) {
    if (deckCode === "") {
      return;
    }
    const deckBase64 = [
      deckCode.replace(/-/g, "+").replace(/_/g, "/"),
      "=".repeat((4 - deckCode.length % 4) % 4)
    ].join("");
    const binaryData = utils_default.isNodeRuntime() ? Uint8Array.from(Buffer.from(deckBase64, "base64")) : Uint8Array.from(atob(deckBase64), (c) => c.charCodeAt(0));
    console.log({
      binaryData,
      length: binaryData.length
    });
    const debug = (startIndex, length) => {
      const slice = [...binaryData.slice(startIndex, startIndex + length)];
      const cardPassword = Number.parseInt(slice.map((b) => b.toString(2)).join(""), 2).toString();
      console.log(`${startIndex} ~ ${startIndex + length - 1}: https://ygocdb.com/card/${cardPassword}`);
      fetch(`https://ygocdb.com/api/v0/?search=${cardPassword}`).then((response) => response.json()).then((response) => console.log({
        cardPassword,
        queryCount: response.result.length,
        cardName: response.result?.[0]?.md_name,
        cardData: response.result?.[0]
      }));
    };
    const start = 22;
    for (let i = start;i < start + 10; i++) {
      debug(i, 4);
    }
    return [...binaryData].map((b) => b.toString(2));
  }
  decode(untappedCode) {
    const [deckCode, deckName] = untappedCode.split(";");
    if (!deckCode) {
      return {
        data: {
          main: new Uint32Array,
          extra: new Uint32Array
        },
        name: "error: parse untapped.gg code failed"
      };
    }
    console.log({ deckCode, length: deckCode.length, deckName });
    console.log({
      rawBytes: this.#getCardPasswordFromBase64(deckCode)
    });
    console.log({
      "93039339": 93039339 .toString(2).replace(/\B(?=(\d{8})+$)/g, " "),
      "12435193": 12435193 .toString(2).replace(/\B(?=(\d{8})+$)/g, " ")
    });
    return {
      data: {
        main: new Uint32Array([89631139]),
        extra: new Uint32Array([])
      },
      name: deckName ?? "Untapped.gg Deck"
    };
  }
  encode(deckData, deckName = "") {
    console.error({ deckName, deckData });
    throw new Error("Method not implemented");
  }
}

// src/core/ydk-codec.ts
class YdkCodec {
  decode(ydkCode) {
    const lines = ydkCode.replaceAll(`\r
`, `
`).split(`
`);
    const deckList = {
      main: [],
      extra: [],
      side: []
    };
    const cursorTypeMap = new Map([
      ["#main", "main"],
      ["#extra", "extra"],
      ["!side", "side"]
    ]);
    const deckName = [];
    let cursorType = "main";
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
        side: deckList.side.length > 0 ? new Uint32Array(deckList.side) : undefined
      },
      name: deckName.pop() ?? "YDK Deck"
    };
  }
  encode(deckData, deckName = "") {
    const lines = [
      deckName === "" ? undefined : `# ${deckName}`,
      "#main",
      ...deckData.main,
      "#extra",
      ...deckData.extra,
      deckData.side ? "!side" : undefined,
      ...deckData.side ?? []
    ];
    return lines.filter((line) => line && line !== "").join(`
`);
  }
}

// src/core/ydke-codec.ts
class YdkeCodec {
  #protocolPrefix = "ydke://";
  #splitter = "!";
  #getCardPasswordFromBase64(cardsBase64) {
    if (cardsBase64 === "") {
      return;
    }
    const binaryData = utils_default.isNodeRuntime() ? Uint8Array.from(Buffer.from(cardsBase64, "base64")) : Uint8Array.from(atob(cardsBase64), (c) => c.charCodeAt(0));
    return new Uint32Array(binaryData.buffer);
  }
  #getBase64FromCardPassword(cardsData) {
    if (cardsData.length === 0) {
      return "";
    }
    const binaryData = new Uint8Array(cardsData.buffer);
    return utils_default.isNodeRuntime() ? Buffer.from(binaryData).toString("base64") : btoa(String.fromCharCode(...binaryData));
  }
  #normalizeCode(ydkeCode) {
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
  decode(ydkeCode) {
    const [main, extra, side] = this.#normalizeCode(ydkeCode);
    if (!main || !extra) {
      return {
        data: {
          main: new Uint32Array,
          extra: new Uint32Array
        },
        name: "error: parse ydke code failed"
      };
    }
    return {
      data: {
        main: this.#getCardPasswordFromBase64(main),
        extra: this.#getCardPasswordFromBase64(extra),
        side: this.#getCardPasswordFromBase64(side ?? "")
      },
      name: "YDKE Deck"
    };
  }
  encode(deckData) {
    return [
      this.#protocolPrefix,
      this.#getBase64FromCardPassword(deckData.main),
      this.#splitter,
      this.#getBase64FromCardPassword(deckData.extra),
      this.#splitter,
      this.#getBase64FromCardPassword(deckData.side ?? new Uint32Array),
      this.#splitter
    ].join("");
  }
}

// src/index.ts
var ydk = new YdkCodec;
var ydke = new YdkeCodec;
var untapped = new UntappedCodec;
var deckRenderer = new html_renderer_default;
var render = deckRenderer.render.bind(deckRenderer);

// src/ygo-deck-debugger.ts
(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.log("Service Worker register failed:", error));
  }
  function downloadTextAsFile(text, filename = "file.txt") {
    const blob = new Blob([text], { type: "text/plain" });
    const objectURL = URL.createObjectURL(blob);
    const anchorElement = document.createElement("a");
    anchorElement.href = objectURL;
    anchorElement.download = filename;
    anchorElement.click();
    setTimeout(() => URL.revokeObjectURL(objectURL), 100);
  }
  let currentDeckData = null;
  let currentDeckName = "";
  const app = document.querySelector("#app");
  if (!app) {
    console.error("App container not found");
    return;
  }
  app.addEventListener("click", (event) => {
    const clickedElement = event.target;
    if (clickedElement.dataset.ygoCardPassword) {
      window.open(`https://ygocdb.com/card/${clickedElement.dataset.ygoCardPassword}`, "_blank");
    }
  });
  app.addEventListener("contextmenu", (event) => {
    const clickedElement = event.target;
    if (clickedElement.dataset.ygoCardName && clickedElement.dataset.ygoCardName !== "unknown") {
      event.preventDefault();
      navigator.clipboard.writeText(clickedElement.dataset.ygoCardName);
    }
  });
  ["dragenter", "dragover", "dragleave", "drop"].map((eventName) => {
    app.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
  ["dragenter", "dragover"].map((eventName) => {
    app.addEventListener(eventName, () => {
      app.dataset.hoverFile = "true";
    });
  });
  ["dragleave", "drop"].map((eventName) => {
    app.addEventListener(eventName, () => {
      app.dataset.hoverFile = "false";
    });
  });
  app.addEventListener("drop", (event) => {
    const loadedFiles = event.dataTransfer?.files;
    if (!loadedFiles || !loadedFiles[0]?.name) {
      return;
    }
    const ydkFile = loadedFiles[0];
    const fileReader = new FileReader;
    fileReader.readAsText(ydkFile);
    fileReader.onload = (event2) => {
      const fileContent = event2.target?.result;
      if (!fileContent || fileContent instanceof ArrayBuffer) {
        alert(`读取 YDK 文件 ${ydkFile.name} 失败`);
        return;
      }
      const result = ydk.decode(fileContent);
      if (!result.data) {
        alert("无效的 YDK 卡组码");
        return;
      }
      refreshDeckData(result, fileContent);
    };
    fileReader.onerror = () => {
      alert("读取 YDK 文件失败");
    };
  });
  const buttonGroupElement = document.querySelector("div[data-ygo-deck-button-group]");
  if (!buttonGroupElement) {
    console.error("YGO deck code buttons not found");
    return;
  }
  const refreshDeckData = ({
    data: deckData,
    name: deckName = "未命名牌组"
  }, deckCode = "") => {
    currentDeckName = deckName;
    currentDeckData = deckData;
    const lastDeck = app.querySelector("div[data-ygo-deck]");
    if (lastDeck) {
      lastDeck.remove();
      app.style.setProperty("--button-visibility", "hidden");
    }
    app.appendChild(render(deckData, deckName, deckCode));
    app.style.setProperty("--button-visibility", "visible");
  };
  buttonGroupElement.addEventListener("click", async (event) => {
    const clickedButton = event.target;
    if (clickedButton.dataset.ygoDeckButton === "import") {
      const deckCodeInClipboard = await navigator.clipboard.readText();
      if (!deckCodeInClipboard || deckCodeInClipboard === "") {
        return;
      }
      let result;
      if (deckCodeInClipboard.startsWith("ydke://")) {
        result = ydke.decode(deckCodeInClipboard);
        const { data: testDeck } = result;
        console.assert(ydke.encode(testDeck) === deckCodeInClipboard.trim());
      } else if (deckCodeInClipboard.includes("#main")) {
        result = ydk.decode(deckCodeInClipboard);
      } else {
        result = untapped.decode(deckCodeInClipboard);
      }
      if (!result.data || result.data.main.length === 0) {
        alert("无效的卡组码格式");
        return;
      }
      refreshDeckData(result, deckCodeInClipboard);
    } else if (clickedButton.dataset.ygoDeckButton === "export") {
      if (!currentDeckData) {
        return;
      }
      let deckCode = "";
      switch (clickedButton.dataset.ygoDeckCodeType) {
        case "ydk": {
          deckCode = ydk.encode(currentDeckData, currentDeckName);
          downloadTextAsFile(deckCode, `${currentDeckName}.ydk`);
          break;
        }
        case "ydke": {
          deckCode = ydke.encode(currentDeckData);
          navigator.clipboard.writeText(deckCode);
          break;
        }
        case "untapped": {
          deckCode = untapped.encode(currentDeckData, currentDeckName);
          navigator.clipboard.writeText(deckCode);
          break;
        }
        default: {
          break;
        }
      }
    }
  });
})();
