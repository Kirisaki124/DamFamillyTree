// Run: npm run validate   (also runs automatically before `npm run build`)
import { readFileSync } from 'node:fs'
import { validateFamily } from '../src/lib/validate.ts'
import type { FamilyConfig, PersonInput } from '../src/types.ts'

const file = new URL('../public/family.json', import.meta.url)
let raw: unknown
try {
  raw = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''))
} catch (e) {
  console.error(`✗ public/family.json is not valid JSON:\n  ${(e as Error).message}`)
  process.exit(1)
}

const errors = validateFamily(raw)
if (errors.length) {
  console.error(`✗ public/family.json has ${errors.length} problem(s):`)
  for (const e of errors) console.error(`  - ${e.path}: ${e.message}`)
  process.exit(1)
}

const perGen = new Map<number, number>()
const walk = (p: PersonInput, gen: number) => {
  perGen.set(gen, (perGen.get(gen) ?? 0) + 1)
  for (const c of p.children ?? []) walk(c, gen + 1)
}
walk((raw as FamilyConfig).root, 1)
const total = [...perGen.values()].reduce((a, b) => a + b, 0)
console.log(`✓ public/family.json is valid — ${total} people across ${perGen.size} generations`)
