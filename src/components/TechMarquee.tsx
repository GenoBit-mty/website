import type { CSSProperties } from 'react'

const toolsRow: Array<string> = [
  'BIOINFORMATICA',
  'GENOMICA',
  'PYTHON',
  'R',
  'SNAKEMAKE',
  'ANALISIS DE DATOS',
  'MACHINE LEARNING',
  'VISUALIZACION',
]

const conceptsRow: Array<string> = [
  'ADN',
  'SECUENCIACION',
  'TRANSCRIPTOMICA',
  'ALGORITMOS',
  'SISTEMAS',
  'INVESTIGACION',
  'COLABORACION',
  'EDUCACION',
]

const TRACK_BASE = 'inline-flex min-w-max items-center gap-[14px]'
const TRACK_LEFT = `${TRACK_BASE} animate-[marquee-left_32s_linear_infinite]`
const TRACK_RIGHT = `${TRACK_BASE} animate-[marquee-right_34s_linear_infinite]`

const PILL_BASE = 'inline-flex items-center justify-center'
const PILL_TOOLS = `${PILL_BASE} font-[family-name:var(--display)] text-[clamp(1.05rem,2.4vw,1.7rem)] font-bold tracking-[-0.03em] text-[var(--gb-ink)]`
const PILL_CONCEPTS = `${PILL_BASE} font-mono text-[clamp(0.95rem,2vw,1.4rem)] font-medium tracking-[-0.01em] text-[var(--gb-warm)]`

const TOOLS_VAR: CSSProperties = {
  fontVariationSettings: '"opsz" 60, "wdth" 90, "wght" 700',
}
const CONCEPTS_VAR: CSSProperties = { fontVariationSettings: 'normal' }

function MarqueeLine({
  items,
  trackClassName,
  pillClassName,
  pillStyle,
}: {
  items: Array<string>
  trackClassName: string
  pillClassName: string
  pillStyle: CSSProperties
}) {
  const repeated = Array.from({ length: 3 }, (_, round) =>
    items.map((item) => ({ id: `${round}-${item}`, label: item })),
  ).flat()

  return (
    <div className="overflow-hidden whitespace-nowrap" aria-hidden="true">
      <div className={trackClassName}>
        {repeated.map((item) => (
          <span key={item.id} className={pillClassName} style={pillStyle}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function TechMarquee() {
  return (
    <section
      className="relative z-[3] mt-[60px] border-y border-[var(--gb-ink)] bg-[var(--gb-paper-deep)] py-[26px]"
      aria-label="Tecnologias y conceptos de GenoBit"
    >
      <MarqueeLine
        items={toolsRow}
        trackClassName={TRACK_LEFT}
        pillClassName={PILL_TOOLS}
        pillStyle={TOOLS_VAR}
      />
      <MarqueeLine
        items={conceptsRow}
        trackClassName={TRACK_RIGHT}
        pillClassName={PILL_CONCEPTS}
        pillStyle={CONCEPTS_VAR}
      />
    </section>
  )
}
