import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { hierarchy, tree } from 'd3-hierarchy'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import 'd3-transition'
import type { Person } from '../types.ts'
import { CARD_H, CARD_W, PersonCard, type Orientation } from './PersonCard.tsx'

const GAP_X = 22 // between siblings
const GAP_Y = 54 // between generations

interface Props {
  root: Person
  collapsed: Set<string>
  selectedId: string | null
  pathIds: Set<string>
  orientation: Orientation
  /** Changing `nonce` re-centres on `id`. */
  focus: { id: string; nonce: number } | null
  /** Changing this number zooms to fit the whole visible tree. */
  fitNonce: number
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onBackground: () => void
}

interface Placed {
  p: Person
  x: number
  y: number
}

export function TreeView({ root, collapsed, selectedId, pathIds, orientation, focus, fitNonce, onSelect, onToggle, onBackground }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [tf, setTf] = useState<ZoomTransform>(zoomIdentity)
  const vertical = orientation === 'vertical'

  const layout = useMemo(() => {
    const h = hierarchy(root, (p) => (collapsed.has(p.id) ? null : p.children))
    const laid = tree<Person>()
      .nodeSize(vertical ? [CARD_W + GAP_X, CARD_H + GAP_Y] : [CARD_H + GAP_X, CARD_W + GAP_Y + 30])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.18))(h)

    const nodes: Placed[] = laid.descendants().map((n) => ({ p: n.data, x: vertical ? n.x : n.y, y: vertical ? n.y : n.x }))
    const pos = new Map(nodes.map((n) => [n.p.id, n]))
    const links = laid.links().map((l) => ({ s: pos.get(l.source.data.id)!, t: pos.get(l.target.data.id)! }))
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x)
      minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y)
    }
    return { nodes, links, pos, bounds: { minX, maxX, minY, maxY } }
  }, [root, collapsed, vertical])

  // d3-zoom handles mouse wheel, drag, pinch; React renders.
  useEffect(() => {
    const svg = svgRef.current!
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.08, 2.5])
      .on('zoom', (e) => setTf(e.transform))
    select(svg).call(z).on('dblclick.zoom', null)
    zoomRef.current = z
    return () => {
      select(svg).on('.zoom', null)
    }
  }, [])

  const apply = useCallback((t: ZoomTransform, animate: boolean) => {
    const svg = svgRef.current
    const z = zoomRef.current
    if (!svg || !z) return
    if (animate) select(svg).transition().duration(550).call(z.transform, t)
    else select(svg).call(z.transform, t)
  }, [])

  const fit = useCallback(
    (mode: 'all' | 'top', animate: boolean) => {
      const svg = svgRef.current
      if (!svg) return
      const { width: w, height: h } = svg.getBoundingClientRect()
      const { minX, maxX, minY, maxY } = layout.bounds
      const pad = 40
      const bw = maxX - minX + CARD_W + pad * 2
      const bh = maxY - minY + CARD_H + pad * 2
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      let k: number, tx: number, ty: number
      if (mode === 'all') {
        k = Math.max(0.08, Math.min(w / bw, h / bh, 1))
        tx = w / 2 - cx * k
        ty = h / 2 - cy * k
      } else if (vertical) {
        // Readable start: fit width if possible, anchored to the top (founder).
        k = Math.max(0.5, Math.min(w / bw, 1))
        tx = w / 2 - cx * k
        ty = pad - (minY - CARD_H / 2) * k
      } else {
        k = Math.max(0.5, Math.min(h / bh, 1))
        tx = pad - (minX - CARD_W / 2) * k
        ty = h / 2 - cy * k
      }
      apply(zoomIdentity.translate(tx, ty).scale(k), animate)
    },
    [layout, vertical, apply],
  )

  // Initial view + on orientation change: show the founder at a readable zoom.
  const lastOrientation = useRef<Orientation | null>(null)
  useEffect(() => {
    if (lastOrientation.current === orientation) return
    fit('top', lastOrientation.current !== null)
    lastOrientation.current = orientation
  }, [orientation, fit])

  const lastFit = useRef(fitNonce)
  useEffect(() => {
    if (lastFit.current === fitNonce) return
    lastFit.current = fitNonce
    fit('all', true)
  }, [fitNonce, fit])

  // Centre on a person (search result / lineage click).
  useEffect(() => {
    if (!focus) return
    const n = layout.pos.get(focus.id)
    const svg = svgRef.current
    if (!n || !svg) return
    const { width: w, height: h } = svg.getBoundingClientRect()
    const k = Math.max(zoomTransform(svg).k, 0.85)
    // Leave room for the detail panel on wide screens.
    const panel = w > 820 ? 380 : 0
    const cy = w > 820 ? h / 2 : h * 0.3
    apply(zoomIdentity.translate((w - panel) / 2 - n.x * k, cy - n.y * k).scale(k), true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce])

  const linkPath = (s: Placed, t: Placed) => {
    if (vertical) {
      const y1 = s.y + CARD_H / 2
      const y2 = t.y - CARD_H / 2
      const my = y1 + (y2 - y1) / 2
      return `M${s.x},${y1}V${my}H${t.x}V${y2}`
    }
    const x1 = s.x + CARD_W / 2
    const x2 = t.x - CARD_W / 2
    const mx = x1 + (x2 - x1) / 2
    return `M${x1},${s.y}H${mx}V${t.y}H${x2}`
  }

  return (
    <svg ref={svgRef} className="tree-svg" onClick={onBackground} role="img" aria-label="Sơ đồ gia phả">
      <g transform={tf.toString()}>
        <g className="links">
          {layout.links.map(({ s, t }) => {
            const hl = pathIds.has(s.p.id) && pathIds.has(t.p.id)
            const br = t.p.branch < 0 ? 'br-x' : `br-${t.p.branch % 8}`
            return <path key={t.p.id} className={`link ${br}${hl ? ' hl' : ''}`} d={linkPath(s, t)} />
          })}
        </g>
        <g className="nodes">
          {layout.nodes.map(({ p, x, y }) => (
            <PersonCard
              key={p.id}
              person={p}
              x={x}
              y={y}
              orientation={orientation}
              collapsed={collapsed.has(p.id)}
              selected={p.id === selectedId}
              onPath={pathIds.has(p.id)}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </g>
      </g>
    </svg>
  )
}
