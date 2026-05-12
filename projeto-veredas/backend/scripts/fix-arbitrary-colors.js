/**
 * Substitui todas as cores arbitrárias (bg-[#...], text-[#...], etc.)
 * pelos tokens nomeados no tailwind.config.ts.
 *
 * Uso: node scripts/fix-arbitrary-colors.js
 */

const fs = require('fs')
const path = require('path')

const SRC = path.resolve(__dirname, '..', 'src')

// Mapeamento: expressão → substituto (ordem importa: mais específico primeiro)
const REPLACEMENTS = [
  // ── #1B5E20 (verde) ──
  [/bg-\[#1B5E20\]/g, 'bg-zab-verde'],
  [/text-\[#1B5E20\]/g, 'text-zab-verde'],
  [/border-\[#1B5E20\]/g, 'border-zab-verde'],
  [/from-\[#1B5E20\]/g, 'from-zab-verde'],
  [/to-\[#1B5E20\]/g, 'to-zab-verde'],
  [/bg-\[#1B5E20\]\/20/g, 'bg-zab-verde/20'],
  [/hover:bg-\[#1B5E20\]/g, 'hover:bg-zab-verde'],
  [/hover:text-\[#1B5E20\]/g, 'hover:text-zab-verde'],

  // ── #2E7D32 (verde hover) ──
  [/hover:bg-\[#2E7D32\]/g, 'hover:bg-zab-verde-hover'],
  [/via-\[#2E7D32\]/g, 'via-zab-verde-hover'],
  [/to-\[#2E7D32\]/g, 'to-zab-verde-hover'],
  [/from-\[#2E7D32\]/g, 'from-zab-verde-hover'],

  // ── #E8F5E9 (verde claro) ──
  [/bg-\[#E8F5E9\]/g, 'bg-zab-verde-claro'],
  [/text-\[#E8F5E9\]/g, 'text-zab-verde-claro'],
  [/hover:bg-\[#E8F5E9\]/g, 'hover:bg-zab-verde-claro'],
  [/hover:bg-\[#E8F5E9\]\/50/g, 'hover:bg-zab-verde-claro/50'],
  [/from-\[#E8F5E9\]/g, 'from-zab-verde-claro'],

  // ── #C8E6C9 (verde claro-2) ──
  [/text-\[#C8E6C9\]/g, 'text-zab-verde-claro-2'],

  // ── #A5D6A7 (verde claro-3) ──
  [/text-\[#A5D6A7\]/g, 'text-zab-verde-claro-3'],
  [/bg-\[#A5D6A7\]/g, 'bg-zab-verde-claro-3'],

  // ── #1B3C1A (verde escuro) ──
  [/to-\[#1B3C1A\]/g, 'to-zab-verde-escuro'],

  // ── #0D1F0E (verde footer) ──
  [/bg-\[#0D1F0E\]/g, 'bg-zab-verde-footer'],

  // ── #B8860B (dourado) ──
  [/bg-\[#B8860B\]\/10/g, 'bg-zab-dourado/10'],
  [/bg-\[#B8860B\]\/20/g, 'bg-zab-dourado/20'],
  [/bg-\[#B8860B\]\/25/g, 'bg-zab-dourado/25'],
  [/shadow-\[#B8860B\]\/25/g, 'shadow-zab-dourado/25'],
  [/border-\[#B8860B\]\/30/g, 'border-zab-dourado/30'],
  [/hover:border-\[#B8860B\]\/30/g, 'hover:border-zab-dourado/30'],
  [/border-\[#B8860B\]/g, 'border-zab-dourado'],
  [/bg-\[#B8860B\]/g, 'bg-zab-dourado'],
  [/text-\[#B8860B\]/g, 'text-zab-dourado'],
  [/hover:bg-\[#B8860B\]/g, 'hover:bg-zab-dourado'],

  // ── #A0760A (dourado hover) ──
  [/hover:bg-\[#A0760A\]/g, 'hover:bg-zab-dourado-hover'],

  // ── #FFF8E1 (dourado claro) ──
  [/bg-\[#FFF8E1\]/g, 'bg-zab-dourado-claro'],
  [/to-\[#FFF8E1\]/g, 'to-zab-dourado-claro'],

  // ── #FCD34D (amber) ──
  [/text-\[#FCD34D\]/g, 'text-zab-amber'],
  [/hover:text-\[#FCD34D\]/g, 'hover:text-zab-amber'],

  // ── #FEFCF3 (creme) ──
  [/bg-\[#FEFCF3\]/g, 'bg-zab-creme'],

  // ── #4B5563 (texto) ──
  [/text-\[#4B5563\]/g, 'text-zab-texto'],
  [/hover:text-\[#4B5563\]/g, 'hover:text-zab-texto'],

  // ── #6B7280 (texto claro) ──
  [/text-\[#6B7280\]/g, 'text-zab-texto-claro'],

  // ── #1A1A1A (footer) ──
  [/to-\[#1A1A1A\]/g, 'to-zab-footer'],

  // ── #F5F5F0 (off white) ──
  [/bg-\[#F5F5F0\]/g, 'bg-zab-off-white'],
]

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  for (const [regex, replacement] of REPLACEMENTS) {
    content = content.replace(regex, replacement)
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    return true
  }
  return false
}

function walkDir(dir) {
  let changed = 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      changed += walkDir(fullPath)
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      if (processFile(fullPath)) {
        console.log(`  ✓ ${path.relative(SRC, fullPath)}`)
        changed++
      }
    }
  }
  return changed
}

console.log('Processando arquivos em src/...')
const total = walkDir(SRC)
console.log(`\n${total} arquivo(s) modificado(s)`)
