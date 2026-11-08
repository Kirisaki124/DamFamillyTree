import { useMemo, useRef, useState } from 'react'
import type { Family } from '../types.ts'
import { search } from '../lib/tree.ts'
import type { Orientation } from './PersonCard.tsx'

interface Props {
  family: Family
  depth: number
  orientation: Orientation
  theme: 'light' | 'dark'
  onPick: (id: string) => void
  onDepth: (gen: number) => void
  onFit: () => void
  onOrientation: (o: Orientation) => void
  onTheme: () => void
}

export function Toolbar({ family, depth, orientation, theme, onPick, onDepth, onFit, onOrientation, onTheme }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(() => search(family, q), [family, q])

  const pick = (id: string) => {
    onPick(id)
    setQ('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <header className="toolbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          <svg viewBox="0 0 32 32" width="30" height="30">
            <rect width="32" height="32" rx="8" />
            <path d="M16 6v20M16 13l-7 6M16 13l7 6M16 19l-5 5M16 19l5 5" />
          </svg>
        </span>
        <div>
          <h1>Gia phả {family.name}</h1>
          <p>
            {family.all.length} người · {family.maxGen} đời
            {family.updated ? ` · cập nhật ${family.updated}` : ''}
          </p>
        </div>
      </div>

      <div className="search">
        <input
          ref={inputRef}
          type="search"
          placeholder="Tìm tên… (vd: dam an)"
          value={q}
          aria-label="Tìm theo tên"
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
            if (e.key === 'Enter' && results[active]) pick(results[active].id)
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        {open && q && (
          <ul className="results" role="listbox">
            {results.length === 0 && <li className="empty">Không tìm thấy</li>}
            {results.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'active' : ''}
                onMouseDown={(e) => { e.preventDefault(); pick(p.id) }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="r-name">{p.name}</span>
                <span className="r-meta">
                  Đời {p.gen}
                  {p.parent ? ` · con ${p.parent.name}` : ' · Thủy tổ'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="controls">
        <label className="depth">
          <span>Hiển thị đến</span>
          <select value={depth} onChange={(e) => onDepth(Number(e.target.value))}>
            {Array.from({ length: family.maxGen }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                {g === family.maxGen ? 'Tất cả' : `Đời ${g}`}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onFit} title="Xem toàn bộ cây">
          Toàn cảnh
        </button>
        <button
          type="button"
          onClick={() => onOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical')}
          title="Đổi chiều sơ đồ"
        >
          {orientation === 'vertical' ? 'Dọc ↕' : 'Ngang ↔'}
        </button>
        <button type="button" className="icon" onClick={onTheme} title="Đổi giao diện sáng/tối" aria-label="Đổi giao diện">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
