import YgoDeckRenderer from "./core/html-renderer";
import { UntappedCodec } from "./core/untapped-codec";
import { YdkCodec } from "./core/ydk-codec";
import { YdkeCodec } from "./core/ydke-codec";

const ydk = new YdkCodec();
const ydke = new YdkeCodec();
const untapped = new UntappedCodec();
const deckRenderer = new YgoDeckRenderer();
const render = deckRenderer.render.bind(deckRenderer);

export { ydk, ydke, untapped, render };
