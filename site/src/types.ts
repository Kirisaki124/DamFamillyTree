export type Sex = 'M' | 'F'

/** One person as written in public/family.json. Only `name` is required. */
export interface PersonInput {
  name: string
  sex?: Sex
  birthDate?: string | null
  deathDate?: string | null
  spouse?: string | null
  note?: string | null
  children?: PersonInput[]
}

/** The whole public/family.json file. */
export interface FamilyConfig {
  $schema?: string
  familyName?: string
  updated?: string
  /** Generation whose members start a colour-coded branch (default 17). */
  branchGeneration?: number
  root: PersonInput
}

/** A person after loading: generation and links are computed from the nesting. */
export interface Person {
  id: string
  gen: number
  name: string
  sex: Sex
  birthDate: string | null
  deathDate: string | null
  spouse: string | null
  note: string | null
  parent: Person | null
  children: Person[]
  /** Index of the colour branch, -1 for ancestors above the branch generation. */
  branch: number
  descendants: number
  searchKey: string
}

export interface Family {
  name: string
  updated: string | null
  root: Person
  all: Person[]
  byId: Map<string, Person>
  maxGen: number
  branchGeneration: number
  branches: Person[]
}
