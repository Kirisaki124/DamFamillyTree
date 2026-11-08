import type { Family, FamilyConfig, Person, PersonInput } from '../types.ts'
import { validateFamily, type ValidationError } from './validate.ts'

export const DEFAULT_BRANCH_GENERATION = 17

/** Lower-case, strip Vietnamese diacritics so "dam an" matches "Đàm An". */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildFamily(config: FamilyConfig): Family {
  const all: Person[] = []
  const byId = new Map<string, Person>()
  const branchGeneration = config.branchGeneration ?? DEFAULT_BRANCH_GENERATION
  const branches: Person[] = []

  const build = (input: PersonInput, parent: Person | null, id: string): Person => {
    const gen = parent ? parent.gen + 1 : 1
    let branch = parent ? parent.branch : -1
    const p: Person = {
      id,
      gen,
      name: input.name.trim(),
      sex: input.sex ?? 'M',
      birthDate: input.birthDate ?? null,
      deathDate: input.deathDate ?? null,
      spouse: input.spouse ?? null,
      note: input.note ?? null,
      parent,
      children: [],
      branch,
      descendants: 0,
      searchKey: normalize(input.name),
    }
    if (gen === branchGeneration) {
      p.branch = branch = branches.length
      branches.push(p)
    }
    all.push(p)
    byId.set(id, p)
    p.children = (input.children ?? []).map((c, i) => build(c, p, `${id}.${i}`))
    p.descendants = p.children.reduce((n, c) => n + 1 + c.descendants, 0)
    return p
  }

  const root = build(config.root, null, 'r')
  return {
    name: config.familyName ?? 'Gia phả',
    updated: config.updated ?? null,
    root,
    all,
    byId,
    maxGen: all.reduce((m, p) => Math.max(m, p.gen), 1),
    branchGeneration,
    branches,
  }
}

export type LoadResult =
  | { ok: true; family: Family }
  | { ok: false; title: string; errors: ValidationError[] }

export async function loadFamily(url = './family.json'): Promise<LoadResult> {
  let text: string
  try {
    const res = await fetch(url, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    text = await res.text()
  } catch (e) {
    return { ok: false, title: 'Không tải được family.json', errors: [{ path: url, message: String(e) }] }
  }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (e) {
    return {
      ok: false,
      title: 'family.json không đúng định dạng JSON',
      errors: [{ path: 'family.json', message: (e as Error).message }],
    }
  }
  const errors = validateFamily(raw)
  if (errors.length) return { ok: false, title: 'family.json có lỗi dữ liệu', errors }
  return { ok: true, family: buildFamily(raw as FamilyConfig) }
}

/** Root → person, inclusive. */
export function lineage(p: Person): Person[] {
  const out: Person[] = []
  for (let c: Person | null = p; c; c = c.parent) out.unshift(c)
  return out
}

export function search(family: Family, query: string, limit = 8): Person[] {
  const q = normalize(query)
  if (!q) return []
  // Lower score = better: exact name, exact last part ("an" → "Đàm An"), prefix, word prefix, substring.
  const score = (k: string): number => {
    if (k === q) return 0
    if (k.endsWith(' ' + q)) return 1
    if (k.startsWith(q)) return 2
    if (k.split(' ').some((w) => w.startsWith(q))) return 3
    if (k.includes(q)) return 4
    return -1
  }
  return family.all
    .map((p) => ({ p, s: score(p.searchKey) }))
    .filter((r) => r.s >= 0)
    .sort((a, b) => a.s - b.s || a.p.name.length - b.p.name.length || a.p.gen - b.p.gen)
    .slice(0, limit)
    .map((r) => r.p)
}
