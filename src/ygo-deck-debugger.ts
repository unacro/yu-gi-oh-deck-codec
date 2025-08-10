import type { YuGiOhDeck } from "./core/utils";
import { render, untapped, ydk, ydke } from "./index";

(() => {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker
			.register("./sw.js")
			.catch((error) => console.log("Service Worker register failed:", error));
	}

	function downloadTextAsFile(text: string, filename = "file.txt") {
		const blob = new Blob([text], { type: "text/plain" });
		const objectURL = URL.createObjectURL(blob);
		const anchorElement = document.createElement("a");
		anchorElement.href = objectURL;
		anchorElement.download = filename;
		anchorElement.click();
		setTimeout(() => URL.revokeObjectURL(objectURL), 100);
	}

	let currentDeckData: YuGiOhDeck | null = null;
	let currentDeckName: string = "";

	const app: HTMLDivElement | null = document.querySelector("#app");
	if (!app) {
		console.error("App container not found");
		return;
	}

	// 点击卡查
	app.addEventListener("click", (event) => {
		const clickedElement = event.target as HTMLElement;
		if (clickedElement.dataset.ygoCardPassword) {
			window.open(
				`https://ygocdb.com/card/${clickedElement.dataset.ygoCardPassword}`,
				"_blank",
			);
		}
	});

	// 右键复制单卡卡名
	app.addEventListener("contextmenu", (event) => {
		const clickedElement = event.target as HTMLElement;
		if (
			clickedElement.dataset.ygoCardName &&
			clickedElement.dataset.ygoCardName !== "unknown"
		) {
			event.preventDefault();
			navigator.clipboard.writeText(clickedElement.dataset.ygoCardName);
		}
	});

	// 拖拽 YDK 文件
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
		const fileReader = new FileReader();
		fileReader.readAsText(ydkFile);
		fileReader.onload = (event) => {
			const fileContent = event.target?.result;
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

	// 监听导入 / 导出按钮
	const buttonGroupElement = document.querySelector(
		"div[data-ygo-deck-button-group]",
	);
	if (!buttonGroupElement) {
		console.error("YGO deck code buttons not found");
		return;
	}
	const refreshDeckData = (
		{
			data: deckData,
			name: deckName = "未命名牌组",
		}: {
			data: YuGiOhDeck;
			name: string;
		},
		deckCode = "",
	) => {
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
		const clickedButton = event.target as HTMLElement;
		if (clickedButton.dataset.ygoDeckButton === "import") {
			const deckCodeInClipboard = await navigator.clipboard.readText();
			if (!deckCodeInClipboard || deckCodeInClipboard === "") {
				return;
			}

			let result: {
				data: YuGiOhDeck;
				name: string;
			};
			if (deckCodeInClipboard.startsWith("ydke://")) {
				result = ydke.decode(deckCodeInClipboard);
				const { data: testDeck } = result;
				console.assert(ydke.encode(testDeck) === deckCodeInClipboard.trim()); // 可逆性检验
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
			let deckCode: string = "";
			switch (clickedButton.dataset.ygoDeckCodeType) {
				case "ydk": {
					deckCode = ydk.encode(currentDeckData);
					downloadTextAsFile(deckCode, `${currentDeckName}.ydk`);
					break;
				}
				case "ydke": {
					deckCode = ydke.encode(currentDeckData);
					navigator.clipboard.writeText(deckCode);
					break;
				}
				case "untapped": {
					deckCode = untapped.encode(currentDeckData);
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
