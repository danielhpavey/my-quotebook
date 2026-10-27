import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { SITE_NAME, SITE_DESCRIPTION, truncate } from './seo';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const OG_SIZE = { width: OG_WIDTH, height: OG_HEIGHT };
// Instagram crops the 1.91:1 link-preview image, so it gets its own square version
const SQUARE_SIZE = { width: 1080, height: 1080 };

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
// a background image; rendered once per build for each image size

// short, thin, slightly curved strokes at random angles; mostly darker
// strands with a few light ones, at the same density whatever the size
const drawFibres = ({ width, height }) => {
  // seeded so every build draws the same fibres
  const random = (seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)(42);
  const count = Math.round(1400 * (width * height) / (OG_WIDTH * OG_HEIGHT));
  return Array.from({ length: count }, () => {
    const x = random() * width;
    const y = random() * height;
    const angle = random() * Math.PI;
    const length = 12 + random() ** 2 * 60;
    const dx = Math.cos(angle) * length;
    const dy = Math.sin(angle) * length;
    const bend = (random() - 0.5) * length * 0.5;
    const cx = x + dx / 2 - Math.sin(angle) * bend;
    const cy = y + dy / 2 + Math.cos(angle) * bend;
    const colour = random() < 0.75 ? '#8c8270' : '#ffffff';
    const strokeWidth = 0.4 + random() * 0.8;
    const opacity = 0.05 + random() * 0.15;
    const n = v => v.toFixed(1);
    return `<path d="M${n(x)} ${n(y)}Q${n(cx)} ${n(cy)} ${n(x + dx)} ${n(y + dy)}" stroke="${colour}" stroke-width="${strokeWidth.toFixed(2)}" stroke-opacity="${opacity.toFixed(2)}"/>`;
  }).join('');
};

const paperSvg = size => `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}">
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
  <g fill="none" stroke-linecap="round">${drawFibres(size)}</g>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
</svg>`;
const papers = new Map();
const paperBackground = size => {
  const key = `${size.width}x${size.height}`;
  if (!papers.has(key)) {
    papers.set(key, `url(data:image/png;base64,${new Resvg(paperSvg(size)).render().asPng().toString('base64')})`);
  }
  return papers.get(key);
};

// a tiny stand-in for JSX so Satori can be used from plain JS
const h = (type, style, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});

// shrink the text as the quote gets longer so it always fits the card; the
// square card is narrower but has far more height, so its text can be larger
const quoteFontSize = (length, square) => {
  if (length <= 60) return square ? 80 : 68;
  if (length <= 120) return square ? 68 : 56;
  if (length <= 200) return square ? 58 : 46;
  if (length <= 300) return square ? 50 : 38;
  return square ? 42 : 32;
};

// Satori adds padding and borders on top of a set width/height, so the root
// fills the image and the padding sits on a child that flex-stretches into it
const card = ({ body, footer }, size) =>
  h('div', {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    backgroundImage: paperBackground(size),
    backgroundSize: `${size.width}px ${size.height}px`,
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
const render = async (content, size = OG_SIZE) => {
  const svg = await satori(card(content, size), { ...size, fonts: await fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size.width } }).render().asPng();
  return sharp(png).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
};

export function quoteImage({ quote, author }, { square = false } = {}) {
  const text = truncate(quote, 400);
  return render({
    body: h('div', {
      fontFamily: 'Lora',
      fontStyle: 'italic',
      fontSize: quoteFontSize(text.length, square),
      lineHeight: 1.35,
    }, `“${text}”`),
    footer: [
      h('div', { fontWeight: 600, color: TEXT }, author ? `— ${author}` : ''),
      h('div', { fontWeight: 600, color: ACCENT }, SITE_NAME),
    ],
  }, square ? SQUARE_SIZE : OG_SIZE);
}

export function siteImage() {
  return render({
    body: h('div', { flexDirection: 'column' },
      h('div', { fontFamily: 'Lora', fontSize: 120, color: TEXT }, SITE_NAME),
      h('div', { fontFamily: 'Inter', fontSize: 40, color: MUTED, marginTop: 24 }, SITE_DESCRIPTION),
    ),
    footer: [],
  });
}

export const jpegResponse = jpeg =>
  new Response(jpeg, { headers: { 'Content-Type': 'image/jpeg' } });
