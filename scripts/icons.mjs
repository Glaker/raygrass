// Genera los íconos PNG del PWA a partir de public/favicon.svg (requiere rsvg-convert)
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const svg = readFileSync('public/favicon.svg', 'utf8')
const png = (src, size, out) => execFileSync('rsvg-convert', ['-w', size, '-h', size, '-o', out, src])

png('public/favicon.svg', '192', 'public/icon-192.png')
png('public/favicon.svg', '512', 'public/icon-512.png')

// Maskable / Apple: fondo completo sin esquinas redondeadas y el dibujo con margen de seguridad
const inner = svg.replace(/<svg[^>]*>/, '').replace('</svg>', '').replace(/<rect[^>]*\/>/, '')
const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#14241B"/><g transform="translate(9.6 9.6) scale(0.7)">${inner}</g></svg>`
const tmp = join(mkdtempSync(join(tmpdir(), 'rg-')), 'full.svg')
writeFileSync(tmp, full)
png(tmp, '512', 'public/icon-maskable-512.png')
png(tmp, '180', 'public/apple-touch-icon.png')
console.log('íconos generados')
