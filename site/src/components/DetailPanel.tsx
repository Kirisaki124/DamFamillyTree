import type { Person } from '../types.ts'
import { lineage } from '../lib/tree.ts'

interface Props {
  person: Person
  onPick: (id: string) => void
  onClose: () => void
}

function PersonLink({ p, onPick }: { p: Person; onPick: (id: string) => void }) {
  const br = p.branch < 0 ? 'br-x' : `br-${p.branch % 8}`
  return (
    <button type="button" className={`plink ${br}`} onClick={() => onPick(p.id)}>
      <span className="dot" />
      {p.name}
      <small>Đời {p.gen}</small>
    </button>
  )
}

export function DetailPanel({ person: p, onPick, onClose }: Props) {
  const line = lineage(p)
  const siblings = p.parent ? p.parent.children.filter((c) => c !== p) : []
  const order = p.parent ? p.parent.children.indexOf(p) + 1 : null
  const facts: [string, string | null][] = [
    ['Giới tính', p.sex === 'F' ? 'Nữ' : 'Nam'],
    ['Thứ bậc', order ? `Con thứ ${order}/${p.parent!.children.length}` : 'Thủy tổ'],
    ['Năm sinh', p.birthDate],
    ['Ngày mất', p.deathDate],
    [p.sex === 'F' ? 'Chồng' : 'Vợ', p.spouse],
    ['Hậu duệ', p.descendants ? `${p.descendants} người` : null],
  ]

  return (
    <aside className="panel" onClick={(e) => e.stopPropagation()}>
      <div className="panel-head">
        <div>
          <span className="eyebrow">Đời {p.gen}</span>
          <h2>{p.name}</h2>
        </div>
        <button type="button" className="icon close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </div>

      <dl className="facts">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
      {p.note && <p className="note">{p.note}</p>}

      {p.parent && (
        <section>
          <h3>Cha</h3>
          <PersonLink p={p.parent} onPick={onPick} />
        </section>
      )}
      {p.children.length > 0 && (
        <section>
          <h3>Con ({p.children.length})</h3>
          <div className="plist">{p.children.map((c) => <PersonLink key={c.id} p={c} onPick={onPick} />)}</div>
        </section>
      )}
      {siblings.length > 0 && (
        <section>
          <h3>Anh em ({siblings.length})</h3>
          <div className="plist">{siblings.map((c) => <PersonLink key={c.id} p={c} onPick={onPick} />)}</div>
        </section>
      )}
      {line.length > 1 && (
        <section>
          <h3>Dòng dõi từ Thủy tổ</h3>
          <ol className="lineage">
            {line.map((a) => (
              <li key={a.id} className={a === p ? 'me' : ''}>
                <button type="button" onClick={() => onPick(a.id)}>
                  <span className="lg">{a.gen}</span>
                  {a.name}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </aside>
  )
}
