import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Family } from './types.ts'
import { lineage, loadFamily, type LoadResult } from './lib/tree.ts'
import { TreeView } from './components/TreeView.tsx'
import { Toolbar } from './components/Toolbar.tsx'
import { DetailPanel } from './components/DetailPanel.tsx'
import type { Orientation } from './components/PersonCard.tsx'

type Theme = 'light' | 'dark'

const store = {
  get(k: string) {
    try { return localStorage.getItem(k) } catch { return null }
  },
  set(k: string, v: string) {
    try { localStorage.setItem(k, v) } catch { /* private mode */ }
  },
}

function initialTheme(): Theme {
  const saved = store.get('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Collapse everyone at generation >= gen who has children, so the tree shows down to `gen`. */
function collapseFrom(family: Family, gen: number): Set<string> {
  return new Set(family.all.filter((p) => p.gen >= gen && p.children.length).map((p) => p.id))
}

export default function App() {
  const [result, setResult] = useState<LoadResult | null>(null)
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    loadFamily().then(setResult)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    store.set('theme', theme)
  }, [theme])

  if (!result) return <div className="splash">Đang tải gia phả…</div>
  if (!result.ok)
    return (
      <div className="error-screen">
        <h1>{result.title}</h1>
        <p>Sửa các lỗi sau trong <code>family.json</code> rồi tải lại trang:</p>
        <ul>
          {result.errors.map((e, i) => (
            <li key={i}>
              <code>{e.path}</code> — {e.message}
            </li>
          ))}
        </ul>
      </div>
    )
  return <FamilyApp family={result.family} theme={theme} onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
}

function FamilyApp({ family, theme, onTheme }: { family: Family; theme: Theme; onTheme: () => void }) {
  const [depth, setDepth] = useState(family.maxGen)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [orientation, setOrientation] = useState<Orientation>(() =>
    store.get('orientation') === 'horizontal' ? 'horizontal' : 'vertical',
  )
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null)
  const [fitNonce, setFitNonce] = useState(0)

  const selected = selectedId ? family.byId.get(selectedId) ?? null : null
  const pathIds = useMemo(() => new Set(selected ? lineage(selected).map((p) => p.id) : []), [selected])

  const pick = useCallback(
    (id: string) => {
      const p = family.byId.get(id)
      if (!p) return
      // Expand every ancestor so the person is visible.
      setCollapsed((prev) => {
        const next = new Set(prev)
        for (let a = p.parent; a; a = a.parent) next.delete(a.id)
        return next
      })
      setSelectedId(id)
      setFocus((f) => ({ id, nonce: (f?.nonce ?? 0) + 1 }))
    },
    [family],
  )

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const select = useCallback((id: string) => setSelectedId((cur) => (cur === id ? null : id)), [])

  return (
    <div className="app">
      <Toolbar
        family={family}
        depth={depth}
        orientation={orientation}
        theme={theme}
        onPick={pick}
        onDepth={(g) => {
          setDepth(g)
          setCollapsed(collapseFrom(family, g))
          setFitNonce((n) => n + 1)
        }}
        onFit={() => setFitNonce((n) => n + 1)}
        onOrientation={(o) => {
          setOrientation(o)
          store.set('orientation', o)
        }}
        onTheme={onTheme}
      />
      <main className="stage">
        <TreeView
          root={family.root}
          collapsed={collapsed}
          selectedId={selectedId}
          pathIds={pathIds}
          orientation={orientation}
          focus={focus}
          fitNonce={fitNonce}
          onSelect={select}
          onToggle={toggle}
          onBackground={() => setSelectedId(null)}
        />
        {family.branches.length > 1 && (
          <div className="legend" aria-label="Chú thích các chi">
            <span className="legend-title">Các chi (từ đời {family.branchGeneration})</span>
            {family.branches.map((b) => (
              <button key={b.id} type="button" className={`plink br-${b.branch % 8}`} onClick={() => pick(b.id)}>
                <span className="dot" />
                {b.name}
                <small>{b.descendants} hậu duệ</small>
              </button>
            ))}
          </div>
        )}
        <p className="hint">Kéo để di chuyển · cuộn/chụm để phóng to · bấm vào tên để xem chi tiết</p>
        {selected && <DetailPanel person={selected} onPick={pick} onClose={() => setSelectedId(null)} />}
      </main>
    </div>
  )
}
