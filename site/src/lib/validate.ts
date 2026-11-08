// Pure validation for family.json — used by the website and by `npm run validate` (Node).
// Keep this file free of DOM / browser APIs.

export interface ValidationError {
  path: string
  message: string
}

const PERSON_KEYS = new Set(['name', 'sex', 'birthDate', 'deathDate', 'spouse', 'note', 'children'])
const TOP_KEYS = new Set(['$schema', 'familyName', 'updated', 'branchGeneration', 'root'])
const OPTIONAL_TEXT = ['birthDate', 'deathDate', 'spouse', 'note']

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function validateFamily(raw: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  const err = (path: string, message: string) => errors.push({ path, message })

  if (!isObj(raw)) {
    err('(file)', 'The file must contain a JSON object { ... }')
    return errors
  }
  for (const k of Object.keys(raw)) if (!TOP_KEYS.has(k)) err(k, `Unknown field "${k}"`)
  if (raw.familyName !== undefined && typeof raw.familyName !== 'string') err('familyName', 'must be text')
  if (raw.updated !== undefined && typeof raw.updated !== 'string') err('updated', 'must be text')
  if (
    raw.branchGeneration !== undefined &&
    (typeof raw.branchGeneration !== 'number' || !Number.isInteger(raw.branchGeneration) || raw.branchGeneration < 1)
  )
    err('branchGeneration', 'must be a whole number ≥ 1')

  if (!isObj(raw.root)) {
    err('root', 'is missing or is not an object { "name": ... }')
    return errors
  }

  const walk = (node: unknown, path: string) => {
    if (!isObj(node)) {
      err(path, 'must be an object { "name": ... }')
      return
    }
    const label = typeof node.name === 'string' && node.name.trim() ? `${path} (${node.name})` : path
    for (const k of Object.keys(node)) {
      if (!PERSON_KEYS.has(k)) err(label, `Unknown field "${k}" — allowed: ${[...PERSON_KEYS].join(', ')}`)
    }
    if (typeof node.name !== 'string' || !node.name.trim()) err(label, '"name" is required and must be non-empty text')
    if (node.sex !== undefined && node.sex !== 'M' && node.sex !== 'F') err(label, '"sex" must be "M" or "F"')
    for (const k of OPTIONAL_TEXT) {
      const v = node[k]
      if (v !== undefined && v !== null && typeof v !== 'string') err(label, `"${k}" must be text or null`)
    }
    if (node.children !== undefined) {
      if (!Array.isArray(node.children)) err(label, '"children" must be a list [ ... ]')
      else node.children.forEach((c, i) => walk(c, `${path}.children[${i}]`))
    }
  }
  walk(raw.root, 'root')
  return errors
}
