import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { SITE_NAME, SITE_DESCRIPTION, truncate } from './seo';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// matches the site's Tailwind colours (gray-700, blue-500)
const TEXT = '#374151';
const ACCENT = '#3b82f6';
const MUTED = '#6b7280';

// Satori needs real font files (TTF/OTF/WOFF, not WOFF2); loaded once per build
const fontFile = file => readFile(join(process.cwd(), 'node_modules/@fontsource', file));
const fonts = Promise.all([
  fontFile('lora/files/lora-latin-400-normal.woff'),
  fontFile('lora/files/lora-latin-400-italic.woff'),
  fontFile('inter/files/inter-latin-400-normal.woff'),
  fontFile('inter/files/inter-latin-600-normal.woff'),
]).then(([loraRegular, loraItalic, interRegular, interSemiBold]) => [
  { name: 'Lora', data: loraRegular, weight: 400, style: 'normal' },
  { name: 'Lora', data: loraItalic, weight: 400, style: 'italic' },
  { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
  { name: 'Inter', data: interSemiBold, weight: 600, style: 'normal' },
]);

// the bundled fonts only cover the basic Latin character set; other quotes
// fall back to the site image rather than rendering missing-glyph boxes
const SUPPORTED = /^[\u0000-\u00ff\u0152\u0153\u2000-\u206f\u20ac\u2122]*$/;
export const canRenderQuote = ({ quote = '', author = '' }) =>
  SUPPORTED.test(quote) && SUPPORTED.test(author);

// a tiny stand-in for JSX so Satori can be used from plain JS
const h = (type, style, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});

// shrink the text as the quote gets longer so it always fits the card
const quoteFontSize = length => {
  if (length <= 60) return 68;
  if (length <= 120) return 56;
  if (length <= 200) return 46;
  if (length <= 300) return 38;
  return 32;
};

// Satori adds padding and borders on top of a set width/height, so the root
// fills the image and the padding sits on a child that flex-stretches into it
const card = ({ body, footer }) =>
  h('div', { width: '100%', height: '100%', flexDirection: 'column', backgroundColor: '#ffffff', color: TEXT },
    h('div', { height: 16, backgroundColor: ACCENT }),
    h('div', { flexGrow: 1, flexDirection: 'column', padding: '56px 80px' },
      h('div', { flexGrow: 1, flexDirection: 'column', justifyContent: 'center' }, body),
      h('div', { justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter', fontSize: 28 }, ...footer),
    ),
  );

const render = async element => {
  const svg = await satori(element, { width: OG_WIDTH, height: OG_HEIGHT, fonts: await fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
};

export function quoteImage({ quote, author }) {
  const text = truncate(quote, 400);
  return render(card({
    body: h('div', {
      fontFamily: 'Lora',
      fontStyle: 'italic',
      fontSize: quoteFontSize(text.length),
      lineHeight: 1.35,
    }, `“${text}”`),
    footer: [
      h('div', { fontWeight: 600, color: TEXT }, author ? `— ${author}` : ''),
      h('div', { fontWeight: 600, color: ACCENT }, SITE_NAME),
    ],
  }));
}

export function siteImage() {
  return render(card({
    body: h('div', { flexDirection: 'column' },
      h('div', { fontFamily: 'Lora', fontSize: 120, color: TEXT }, SITE_NAME),
      h('div', { fontFamily: 'Inter', fontSize: 40, color: MUTED, marginTop: 24 }, SITE_DESCRIPTION),
    ),
    footer: [],
  }));
}

export const pngResponse = png =>
  new Response(png, { headers: { 'Content-Type': 'image/png' } });
