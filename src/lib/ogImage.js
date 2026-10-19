import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
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

// Satori can't apply SVG filters, so the paper texture is drawn by resvg
// (scattered fibres over a soft grain on off-white) and passed to Satori as
// a background image; rendered once per build

// seeded so every build draws the same fibres
const random = (seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)(42);

// short, thin, slightly curved strokes at random angles; mostly darker
// strands with a few light ones
const fibres = Array.from({ length: 1400 }, () => {
  const x = random() * OG_WIDTH;
  const y = random() * OG_HEIGHT;
  const angle = random() * Math.PI;
  const length = 12 + random() ** 2 * 60;
  const dx = Math.cos(angle) * length;
  const dy = Math.sin(angle) * length;
  const bend = (random() - 0.5) * length * 0.5;
  const cx = x + dx / 2 - Math.sin(angle) * bend;
  const cy = y + dy / 2 + Math.cos(angle) * bend;
  const colour = random() < 0.75 ? '#8c8270' : '#ffffff';
  const width = 0.4 + random() * 0.8;
  const opacity = 0.05 + random() * 0.15;
  const n = v => v.toFixed(1);
  return `<path d="M${n(x)} ${n(y)}Q${n(cx)} ${n(cy)} ${n(x + dx)} ${n(y + dy)}" stroke="${colour}" stroke-width="${width.toFixed(2)}" stroke-opacity="${opacity.toFixed(2)}"/>`;
}).join('');

const PAPER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="7"/>
      <feDiffuseLighting lighting-color="#fff" surfaceScale="1.2">
        <feDistantLight azimuth="45" elevation="60"/>
      </feDiffuseLighting>
      <!-- lift the shading so flat areas stay near white -->
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.2"/>
        <feFuncG type="linear" slope="1.2"/>
        <feFuncB type="linear" slope="1.2"/>
      </feComponentTransfer>
    </filter>
    <filter id="mottle" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="3" seed="3"/>
      <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0.7 -0.2"/>
    </filter>
    <radialGradient id="vignette" r="75%">
      <stop offset="60%" stop-color="#8a6d3b" stop-opacity="0"/>
      <stop offset="100%" stop-color="#8a6d3b" stop-opacity="0.08"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#fdfcf8"/>
  <rect width="100%" height="100%" filter="url(#mottle)" opacity="0.12"/>
  <rect width="100%" height="100%" filter="url(#grain)" opacity="0.25" style="mix-blend-mode:multiply"/>
  <g fill="none" stroke-linecap="round">${fibres}</g>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
</svg>`;
let paper;
const paperBackground = () => {
  paper ??= `url(data:image/png;base64,${new Resvg(PAPER_SVG).render().asPng().toString('base64')})`;
  return paper;
};

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
  h('div', {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    backgroundImage: paperBackground(),
    backgroundSize: `${OG_WIDTH}px ${OG_HEIGHT}px`,
    color: TEXT,
  },
    h('div', { height: 16, backgroundColor: ACCENT }),
    h('div', { flexGrow: 1, flexDirection: 'column', padding: '56px 80px' },
      h('div', { flexGrow: 1, flexDirection: 'column', justifyContent: 'center' }, body),
      h('div', { justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter', fontSize: 28 }, ...footer),
    ),
  );

// JPEG rather than PNG: the paper texture is noise, which PNG can't compress
// (~650 KB vs ~100 KB), and WhatsApp drops previews for large images
const render = async element => {
  const svg = await satori(element, { width: OG_WIDTH, height: OG_HEIGHT, fonts: await fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
  return sharp(png).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
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

export const jpegResponse = jpeg =>
  new Response(jpeg, { headers: { 'Content-Type': 'image/jpeg' } });
