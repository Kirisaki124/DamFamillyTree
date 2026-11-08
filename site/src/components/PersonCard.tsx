import { memo } from 'react'
import type { Person } from '../types.ts'

export const CARD_W = 184
export const CARD_H = 66

export type Orientation = 'vertical' | 'horizontal'

/** Greedy word wrap into at most `maxLines` lines of ~`max` characters. */
function wrap(text: string, max = 21, maxLines = 2): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (!cur) cur = w
    else if ((cur + ' ' + w).length <= max) cur += ' ' + w
    else {
      lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = kept[maxLines - 1].slice(0, max - 1) + '…'
    return kept
  }
  return lines
}

interface Props {
  person: Person
  x: number
  y: number
  orientation: Orientation
  collapsed: boolean
  selected: boolean
  onPath: boolean
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}

function PersonCardImpl({ person: p, x, y, orientation, collapsed, selected, onPath, onSelect, onToggle }: Props) {
  const lines = wrap(p.name)
  const branchClass = p.branch < 0 ? 'br-x' : `br-${p.branch % 8}`
  const cls = ['node', branchClass, selected && 'selected', onPath && 'onpath', p.sex === 'F' && 'female']
    .filter(Boolean)
    .join(' ')
  const nameY = lines.length === 1 ? 45 : 37
  const hasKids = p.children.length > 0
  const togglePos = orientation === 'vertical' ? `translate(${CARD_W / 2},${CARD_H})` : `translate(${CARD_W},${CARD_H / 2})`

  return (
    <g
      className={cls}
      transform={`translate(${x - CARD_W / 2},${y - CARD_H / 2})`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(p.id)
      }}
    >
      <title>{`${p.name} — Đời ${p.gen}${p.descendants ? ` · ${p.descendants} hậu duệ` : ''}`}</title>
      <rect className="card" width={CARD_W} height={CARD_H} rx={10} />
      <rect className="accent" x={0} y={0} width={6} height={CARD_H} rx={3} />
      <text className="gen" x={16} y={18}>
        ĐỜI {p.gen}
      </text>
      {p.deathDate && (
        <text className="death" x={CARD_W - 10} y={18} textAnchor="end">
          † {p.deathDate.length > 12 ? p.deathDate.slice(0, 11) + '…' : p.deathDate}
        </text>
      )}
      <text className="name" x={16} y={nameY}>
        {lines.map((l, i) => (
          <tspan key={i} x={16} dy={i ? 16 : 0}>
            {l}
          </tspan>
        ))}
      </text>
      {hasKids && (
        <g
          className={`toggle${collapsed ? ' is-collapsed' : ''}`}
          transform={togglePos}
          onClick={(e) => {
            e.stopPropagation()
            onToggle(p.id)
          }}
        >
          <title>{collapsed ? `Mở ${p.children.length} con` : 'Thu gọn'}</title>
          <rect x={collapsed ? -15 : -10} y={-10} width={collapsed ? 30 : 20} height={20} rx={10} />
          <text textAnchor="middle" dy="0.35em">
            {collapsed ? `+${p.children.length}` : '−'}
          </text>
        </g>
      )}
    </g>
  )
}

export const PersonCard = memo(PersonCardImpl)
