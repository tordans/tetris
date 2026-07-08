import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

type IconSpec = {
  name: string
  size: number
  maskable?: boolean
}

const icons: IconSpec[] = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-512x512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.png', size: 32 },
]

const BLOCK_COLORS = ['#00e5ff', '#ffea00', '#d500f9', '#00e676', '#ff1744', '#2979ff', '#ff9100']

const buildSvg = (size: number, maskable = false) => {
  const pad = maskable ? size * 0.12 : size * 0.08
  const inner = size - pad * 2
  const block = inner * 0.22
  const gap = inner * 0.04
  const radius = size * 0.18
  const blockRadius = block * 0.18

  const blocks = [
    { x: 1, y: 2, color: BLOCK_COLORS[0] },
    { x: 2, y: 2, color: BLOCK_COLORS[0] },
    { x: 3, y: 2, color: BLOCK_COLORS[0] },
    { x: 4, y: 2, color: BLOCK_COLORS[0] },
    { x: 2, y: 1, color: BLOCK_COLORS[1] },
    { x: 3, y: 1, color: BLOCK_COLORS[1] },
    { x: 2, y: 3, color: BLOCK_COLORS[2] },
    { x: 3, y: 3, color: BLOCK_COLORS[2] },
    { x: 1, y: 3, color: BLOCK_COLORS[3] },
    { x: 0, y: 4, color: BLOCK_COLORS[4] },
    { x: 1, y: 4, color: BLOCK_COLORS[4] },
  ]

  const gridW = 5
  const gridH = 5
  const gridWidth = gridW * block + (gridW - 1) * gap
  const gridHeight = gridH * block + (gridH - 1) * gap
  const offsetX = pad + (inner - gridWidth) / 2
  const offsetY = pad + (inner - gridHeight) / 2

  const blockRects = blocks
    .map(
      ({ x, y, color }) =>
        `<rect x="${offsetX + x * (block + gap)}" y="${offsetY + y * (block + gap)}" width="${block}" height="${block}" fill="${color}" rx="${blockRadius}"/>`,
    )
    .join('')

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1a1a2e" rx="${radius}"/>
    ${blockRects}
  </svg>`
}

await mkdir('public', { recursive: true })

for (const { name, size, maskable } of icons) {
  const svg = buildSvg(size, maskable)
  await sharp(Buffer.from(svg)).png().toFile(`public/${name}`)
  console.log(`Wrote public/${name}`)
}

await sharp(Buffer.from(buildSvg(32)))
  .resize(16, 16)
  .png()
  .toFile('public/favicon-16x16.png')
console.log('Wrote public/favicon-16x16.png')
