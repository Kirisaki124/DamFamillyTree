// One-off check: does public/family.json match the original xlsx export (scripts/expected.tsv)?
// expected.tsv lines: generation <TAB> name <TAB> father name
// Once you start adding members this will (correctly) report the new people as extra.
import { readFileSync } from 'node:fs'

const json = JSON.parse(readFileSync(new URL('../public/family.json', import.meta.url), 'utf8'))
const expected = readFileSync(new URL('./expected.tsv', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)

const actual = []
const walk = (p, gen, father) => {
  actual.push(`${gen}\t${p.name}\t${father}`)
  for (const c of p.children ?? []) walk(c, gen + 1, p.name)
}
walk(json.root, 1, '')

const count = (list) => list.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map())
const a = count(actual)
const e = count(expected)
let ok = true
for (const [k, n] of e) if ((a.get(k) ?? 0) < n) { ok = false; console.log('missing in json:', k.replaceAll('\t', ' | ')) }
for (const [k, n] of a) if ((e.get(k) ?? 0) < n) { ok = false; console.log('extra in json:  ', k.replaceAll('\t', ' | ')) }
console.log(ok ? `✓ family.json matches the xlsx (${actual.length} people)` : '✗ differences found')
process.exit(ok ? 0 : 1)
