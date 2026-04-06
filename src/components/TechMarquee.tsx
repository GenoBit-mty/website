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

function MarqueeLine({
  items,
  className,
}: {
  items: Array<string>
  className: string
}) {
  const repeated = Array.from({ length: 3 }, (_, round) =>
    items.map((item) => ({ id: `${round}-${item}`, label: item }))
  ).flat()

  return (
    <div className="marquee-row" aria-hidden="true">
      <div className={className}>
        {repeated.map((item) => (
          <span key={item.id} className="marquee-pill">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function TechMarquee() {
  return (
    <section className="tech-marquee" aria-label="Tecnologias y conceptos de GenoBit">
      <MarqueeLine items={toolsRow} className="marquee-track marquee-left" />
      <MarqueeLine items={conceptsRow} className="marquee-track marquee-right" />
    </section>
  )
}
