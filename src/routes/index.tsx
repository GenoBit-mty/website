import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { DnaHelix } from "@/components/DnaHelix";
import { TechMarquee } from '@/components/TechMarquee'

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.25])
  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.9])
  const [dnaMode, setDnaMode] = useState<'hero' | 'content'>('hero')
  const [isBooting, setIsBooting] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsBooting(false)
    }, 1650)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Parallax effect for hero text
    const handleScroll = () => {
      const scroll = window.pageYOffset
      const parallaxTexts = document.querySelectorAll('.parallax-text')
      parallaxTexts.forEach((text) => {
        const speed = text.getAttribute('data-speed')
        if (speed) {
          ;(text as HTMLElement).style.transform = `translateX(${scroll * parseFloat(speed) * 0.1}px)`
        }
      })
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const threshold = window.innerHeight * 0.8
      setDnaMode(window.scrollY < threshold ? 'hero' : 'content')
    }

    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <AnimatePresence>
        {isBooting && (
          <motion.div
            className="boot-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          >
            <motion.img
              src="/GenobitLogo.png"
              alt="GenoBit logo"
              className="boot-logo"
              initial={{ opacity: 0, y: 22, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
            <motion.p
              className="boot-label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Inicializando plataforma GenoBit...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <div className={`dna-stage dna-${dnaMode}`}>
          <DnaHelix />
        </div>

      {/* ===================== HERO ===================== */}
        <motion.section className="hero-section" style={{ opacity: heroOpacity, scale: heroScale }}>
          <div className="hero-title-wrap reveal-on-scroll visible">
          <span className="huge-type parallax-text" data-speed="-1.5">
            GENO
          </span>
          <span className="huge-type outline-text hero-bit parallax-text hero-offset" data-speed="1.5">
            BIT
          </span>
          <p className="hero-subtitle">
            Grupo Estudiantil de Bioinformática
          </p>
          <div className="hero-actions">
            <Link to="/events" className="editorial-btn filled" data-cursor-hover>
              Ver próximos eventos
            </Link>
            <Link to="/team" className="editorial-btn" data-cursor-hover>
              Conoce al equipo
            </Link>
          </div>
          </div>

          <div className="hero-placeholder hero-placeholder-left" data-cursor-hover>
            Placeholder: Logo aliado
          </div>
          <div className="hero-placeholder hero-placeholder-right" data-cursor-hover>
            Placeholder: CTA secundario
          </div>
        </motion.section>

      {/* ===================== INTRO ===================== */}

        <section className="page-section">
        <div className="site-container reveal-on-scroll">
          <div className="intro-block">
            <h2 className="intro-title">
              IMPULSANDO EL DESCUBRIMIENTO CIENTÍFICO A TRAVÉS DE LA COMPUTACIÓN.
            </h2>
            <p className="intro-description">
              Operamos en la intersección de la genómica, la ciencia de datos y la
              programación. Somos estudiantes que construyen herramientas para
              descifrar el lenguaje de la vida.
            </p>
          </div>
        </div>
        </section>

      {/* ===================== MARQUEE ===================== */}
        <TechMarquee />

      {/* ===================== PLACEHOLDERS ===================== */}
        <section className="page-section placeholder-zone">
        <div className="site-container placeholder-grid reveal-on-scroll">
          <article className="layout-placeholder-card stagger-child" data-cursor-hover>
            <h3>Placeholder: Sponsors</h3>
            <p>Espacio reservado para logos, convenios o aliados estratégicos.</p>
          </article>
          <article className="layout-placeholder-card stagger-child" data-cursor-hover>
            <h3>Placeholder: Próximo Taller</h3>
            <p>Tarjeta editable para destacar un taller o convocatoria importante.</p>
          </article>
          <article className="layout-placeholder-card stagger-child" data-cursor-hover>
            <h3>Placeholder: Recurso Descargable</h3>
            <p>Incluye guía, plantilla o dataset para la comunidad.</p>
          </article>
        </div>
        </section>

      {/* ===================== SECTIONS ===================== */}
        <section className="page-section">
        <div className="site-container">
          <div className="sticky-type">EXPLORA</div>

          {/* --- Investigación --- */}
          <div className="content-row reveal-on-scroll">
            <div className="content-info">
              <span className="mono-label">01 / INVESTIGACIÓN</span>
              <h3 className="section-display">
                PAPERS
              </h3>
              <p className="section-copy">
                Explora nuestros proyectos, publicaciones y colaboraciones
                científicas en bioinformática y genómica computacional.
              </p>
              <div className="divider" />
              <Link to="/research" className="editorial-btn">
                Ver Investigaciones
              </Link>
            </div>
            <div className="content-media">
              <img
                src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1000"
                alt="Investigación en bioinformática — microscopio y muestras de laboratorio"
                className="content-image"
              />
              <div className="floating-label outline-text">
                ADN
              </div>
            </div>
          </div>

          {/* --- Equipo --- */}
          <div className="content-row reverse reveal-on-scroll">
            <div className="content-info">
              <span className="mono-label">02 / EQUIPO</span>
              <h3 className="section-display">
                EQUIPO
              </h3>
              <p className="section-copy">
                Conoce al equipo apasionado que impulsa GenoBit. Estudiantes de
                diversas disciplinas unidos por la bioinformática.
              </p>
              <div className="divider" />
              <Link to="/team" className="editorial-btn">
                Conoce al Equipo
              </Link>
            </div>
            <div className="content-media">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000"
                alt="Equipo de trabajo colaborando en proyectos de bioinformática"
                className="content-image"
              />
              <div className="floating-label outline-text floating-left">
                GEN
              </div>
            </div>
          </div>

          {/* --- Eventos --- */}
          <div className="content-row reveal-on-scroll">
            <div className="content-info">
              <span className="mono-label">03 / EVENTOS</span>
              <h3 className="section-display">
                LABS
              </h3>
              <p className="section-copy">
                Talleres, conferencias y hackathons. Participa en nuestros
                eventos y potencia tu formación en bioinformática.
              </p>
              <div className="divider" />
              <Link to="/events" className="editorial-btn">
                Calendario Completo
              </Link>
            </div>
            <div className="content-media">
              <img
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000"
                alt="Evento de bioinformática — conferencia y networking"
                className="content-image"
              />
              <div className="floating-label outline-text">
                DATO
              </div>
            </div>
          </div>
        </div>
        </section>
      </main>
    </>
  );
}