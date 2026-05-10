import type { Lang } from './types'

const dict = {
  // Nav
  'nav.home': { es: 'Inicio', en: 'Home' },
  'nav.team': { es: 'Equipo', en: 'Team' },
  'nav.research': { es: 'Investigación', en: 'Research' },
  'nav.events': { es: 'Eventos', en: 'Events' },
  'nav.archive': { es: 'Archivo', en: 'Archive' },
  'nav.menu.open': { es: 'Abrir menú', en: 'Open menu' },
  'nav.menu.label': { es: 'Menú móvil', en: 'Mobile menu' },
  'nav.main.label': { es: 'Navegación principal', en: 'Main navigation' },
  'nav.logo.alt': { es: 'GenoBit - Inicio', en: 'GenoBit - Home' },

  // Boot
  'boot.tagline': {
    es: 'Inicializando plataforma GenoBit...',
    en: 'Initializing GenoBit platform...',
  },
  'boot.logo.alt': { es: 'Logo GenoBit', en: 'GenoBit logo' },

  // Home / hero
  'hero.eyebrow': {
    es: 'Est. 2025 · Tec de Monterrey',
    en: 'Est. 2025 · Tec de Monterrey',
  },
  'hero.subtitle': {
    es: 'Investigación estudiantil que une biología y código. Bioinformática, genómica y aprendizaje computacional desde Monterrey.',
    en: 'Student research bridging biology and code. Bioinformatics, genomics, and computational learning from Monterrey.',
  },
  'hero.cta.events': { es: 'Próximos eventos', en: 'Upcoming events' },
  'hero.cta.team': { es: 'Conoce al equipo', en: 'Meet the team' },
  'hero.meta.location': { es: 'Monterrey · MX', en: 'Monterrey · MX' },
  'hero.meta.lat': { es: 'Lat · 25.6°N', en: 'Lat · 25.6°N' },
  'hero.meta.vol': { es: 'Vol · 01 / 04', en: 'Vol · 01 / 04' },
  'hero.meta.sections': {
    es: 'Investigación / Equipo / Eventos / Archivo',
    en: 'Research / Team / Events / Archive',
  },

  // Home / manifesto
  'home.manifesto.label': { es: '— Manifiesto / 01', en: '— Manifesto / 01' },
  'home.manifesto.title': {
    es: 'Tendiendo puentes entre biología y código.',
    en: 'Bridging biology and code.',
  },
  'home.manifesto.body': {
    es: 'GenoBit es la primera organización estudiantil de bioinformática del Tecnológico de Monterrey. Aplicamos programación y ciencia de datos a problemas biológicos y de salud, con la convicción de que la colaboración entre disciplinas es donde nace el descubrimiento. Investigación, docencia y comunidad — un mismo organismo.',
    en: 'GenoBit is the first student bioinformatics organization at Tecnológico de Monterrey. We apply programming and data science to biological and health problems, convinced that interdisciplinary collaboration is where discovery is born. Research, teaching, and community — one organism.',
  },

  // Home / sections preview
  'home.explore': { es: 'explora', en: 'explore' },
  'home.research.label': { es: '— 01 / Investigación', en: '— 01 / Research' },
  'home.research.title': { es: 'Papers', en: 'Papers' },
  'home.research.body': {
    es: 'Proyectos, publicaciones y colaboraciones en bioinformática y genómica computacional. De la pregunta biológica a la inferencia estadística.',
    en: 'Projects, publications, and collaborations in bioinformatics and computational genomics. From biological question to statistical inference.',
  },
  'home.research.cta': { es: 'Ver investigaciones', en: 'View research' },

  'home.team.label': { es: '— 02 / Equipo', en: '— 02 / Team' },
  'home.team.title': { es: 'Equipo', en: 'Team' },
  'home.team.body': {
    es: 'Estudiantes de biología, medicina, ingeniería y ciencias de datos — un colectivo interdisciplinario que hace posible la investigación.',
    en: 'Students of biology, medicine, engineering, and data science — an interdisciplinary collective making research possible.',
  },
  'home.team.cta': { es: 'Conoce al equipo', en: 'Meet the team' },

  'home.events.label': { es: '— 03 / Eventos', en: '— 03 / Events' },
  'home.events.title': { es: 'Labs', en: 'Labs' },
  'home.events.body': {
    es: 'Talleres, conferencias y hackathons abiertos a la comunidad. Aprender haciendo, frente al teclado y al código.',
    en: 'Workshops, lectures, and hackathons open to the community. Learning by doing, in front of keyboard and code.',
  },
  'home.events.cta': { es: 'Calendario completo', en: 'Full calendar' },

  // Footer
  'footer.cta': { es: 'ÚNETE — HOY', en: 'JOIN — TODAY' },
  'footer.tagline': {
    es: 'BIOINFORMÁTICA · GENÓMICA',
    en: 'BIOINFORMATICS · GENOMICS',
  },

  // Team page
  'team.header.eyebrow': { es: 'Nuestro colectivo', en: 'Our collective' },
  'team.header.title.pre': { es: 'El', en: 'The' },
  'team.header.title.em': { es: 'equipo', en: 'team' },
  'team.header.lead': {
    es: 'Estudiantes de biología, ingeniería, medicina y ciencias de datos. Un colectivo interdisciplinario que sostiene la investigación, la docencia y la comunidad de GenoBit.',
    en: 'Students of biology, engineering, medicine, and data science. An interdisciplinary collective sustaining research, teaching, and community at GenoBit.',
  },
  'team.group.directives': { es: 'Mesa Directiva', en: 'Board' },
  'team.group.ndrg': {
    es: 'Neurodegenerative Diseases Research Group',
    en: 'Neurodegenerative Diseases Research Group',
  },
  'team.group.proteomics': {
    es: 'Proteomics & Molecular Biology Group',
    en: 'Proteomics & Molecular Biology Group',
  },
  'team.group.studentCommunity': {
    es: 'Student Community Coordinators',
    en: 'Student Community Coordinators',
  },
  'team.group.ndrg.body': {
    es: 'Aplicamos métodos computacionales al estudio de enfermedades neurológicas, con énfasis en Alzheimer — neuroimagen 3D, biomarcadores y aprendizaje profundo.',
    en: "We apply computational methods to the study of neurological diseases, with a focus on Alzheimer's — 3D neuroimaging, biomarkers, and deep learning.",
  },
  'team.group.proteomics.body': {
    es: 'Tendemos puentes entre biología molecular y computación a través de experiencias de aprendizaje accesibles centradas en el plegamiento de proteínas.',
    en: 'We bridge molecular biology and computing through accessible learning experiences focused on protein folding.',
  },
  'team.firstBoard': { es: 'Primera Mesa Directiva', en: 'Founding Board' },
  'team.tenure': { es: 'Gestión', en: 'Tenure' },
  'team.email': { es: 'Correo', en: 'Email' },
  'team.pastBoards.label': {
    es: 'Archivo / Gestiones',
    en: 'Archive / Boards',
  },
  'team.pastBoards.title': { es: 'Mesas Pasadas', en: 'Past Boards' },
  'team.pastBoards.body': {
    es: 'Conoce a las mesas directivas anteriores que han construido el legado de GenoBit.',
    en: 'Meet the past boards that built the GenoBit legacy.',
  },
  'team.pastBoards.cta': {
    es: 'Ver Gestiones Pasadas',
    en: 'View Past Boards',
  },

  // Events page
  'events.header.eyebrow': { es: 'Calendario abierto', en: 'Open calendar' },
  'events.header.title': { es: 'Eventos', en: 'Events' },
  'events.header.lead': {
    es: 'Talleres, conferencias y reuniones de la comunidad. Aprender haciendo — frente al teclado, frente al pizarrón, frente al código.',
    en: 'Workshops, lectures, and community meetings. Learning by doing — in front of keyboard, in front of board, in front of code.',
  },
  'events.upcoming': { es: '● Próximo', en: '● Upcoming' },
  'events.past': { es: '○ Pasado', en: '○ Past' },
  'events.register': { es: 'Registrarse', en: 'Register' },
  'events.placeholder': { es: 'Evento', en: 'Event' },
  'events.location.alt': { es: 'Ubicación', en: 'Location' },
  'events.section.upcoming': { es: 'Próximos eventos', en: 'Upcoming events' },
  'events.section.past': { es: 'Eventos pasados', en: 'Past events' },
  'events.empty.upcoming': { es: 'Próximamente', en: 'Coming soon' },
  'events.detail.back': { es: '← Volver a eventos', en: '← Back to events' },
  'events.detail.gallery': { es: 'Galería', en: 'Gallery' },
  'events.detail.notFound': {
    es: 'Evento no encontrado',
    en: 'Event not found',
  },
  'events.detail.lightbox.close': { es: 'Cerrar', en: 'Close' },
  'events.detail.lightbox.prev': { es: 'Anterior', en: 'Previous' },
  'events.detail.lightbox.next': { es: 'Siguiente', en: 'Next' },

  // Research page
  'research.header.eyebrow': {
    es: 'Producción científica',
    en: 'Scientific output',
  },
  'research.header.title.pre': { es: 'Investigaciones', en: 'Research' },
  'research.header.title.post': { es: '& papers', en: '& papers' },
  'research.header.lead': {
    es: 'Proyectos, publicaciones y colaboraciones de los grupos de investigación de GenoBit. De la pregunta biológica a la inferencia computacional.',
    en: "Projects, publications, and collaborations of GenoBit's research groups. From biological question to computational inference.",
  },
  'research.group01.label': {
    es: '— Group 01 / NDRG',
    en: '— Group 01 / NDRG',
  },
  'research.group01.title': {
    es: 'Neurodegenerative Diseases Research Group',
    en: 'Neurodegenerative Diseases Research Group',
  },
  'research.group01.body1': {
    es: 'Aplicamos métodos computacionales al estudio de enfermedades neurológicas, con énfasis en la detección temprana del Alzheimer.',
    en: "We apply computational methods to the study of neurological diseases, with a focus on early Alzheimer's detection.",
  },
  'research.group01.body2': {
    es: 'Integramos fuentes multimodales — neuroimagen 3D por MRI y biomarcadores en sangre y líquido cefalorraquídeo — para capturar tanto cambios estructurales del cerebro como señales biológicas asociadas a la progresión de la enfermedad.',
    en: 'We integrate multimodal sources — 3D MRI neuroimaging and biomarkers from blood and cerebrospinal fluid — to capture both structural brain changes and biological signals associated with disease progression.',
  },
  'research.group01.body3': {
    es: 'Actualmente exploramos técnicas modernas de aprendizaje automático y profundo para mejorar la clasificación y el diagnóstico, contribuyendo a herramientas robustas y data-driven para la investigación neurodegenerativa.',
    en: 'We are currently exploring modern machine and deep learning techniques to improve classification and diagnosis, contributing robust, data-driven tools for neurodegenerative research.',
  },
  'research.group02.label': {
    es: '— Group 02 / Proteomics',
    en: '— Group 02 / Proteomics',
  },
  'research.group02.title': {
    es: 'Proteomics & Molecular Biology',
    en: 'Proteomics & Molecular Biology',
  },
  'research.group02.body1': {
    es: 'Tendemos puentes entre biología molecular y herramientas computacionales a través de experiencias de aprendizaje accesibles e innovadoras.',
    en: 'We bridge molecular biology and computational tools through accessible, innovative learning experiences.',
  },
  'research.group02.body2': {
    es: 'Trabajamos sobre el problema del plegamiento de proteínas, apoyándonos en AlphaFold para entender cómo predecir su estructura — y cómo explicarlo a estudiantes que recién comienzan en la bioingeniería.',
    en: 'We work on the protein folding problem, leveraging AlphaFold to understand how to predict structure — and how to explain it to students just beginning in bioengineering.',
  },
  'research.group02.body3': {
    es: 'Estamos construyendo una aplicación móvil en Swift que combina visualización interactiva de proteínas con lecciones guiadas en biología molecular y bioinformática.',
    en: 'We are building a Swift mobile app that combines interactive protein visualization with guided lessons in molecular biology and bioinformatics.',
  },
  'research.papers.label': { es: '— Selected papers', en: '— Selected papers' },
  'research.papers.title': { es: 'Publicaciones', en: 'Publications' },
  'research.read': { es: 'Leer publicación', en: 'Read publication' },
  'research.placeholder': { es: 'Paper', en: 'Paper' },
  'research.detail.back': { es: 'Volver a papers', en: 'Back to papers' },
  'research.detail.readOriginal': { es: 'Leer original', en: 'Read original' },
  'research.detail.notFound': {
    es: 'No se encontró el paper',
    en: 'Paper not found',
  },
  'research.detail.gallery': { es: 'Galería', en: 'Gallery' },

  // Archive page
  'archive.header.eyebrow': {
    es: 'Legado · Mesas anteriores',
    en: 'Legacy · Past boards',
  },
  'archive.header.title.pre': { es: 'Archivo', en: 'Archive' },
  'archive.header.title.post': { es: 'de gestiones', en: 'of boards' },
  'archive.header.lead': {
    es: 'Las mesas directivas que han sostenido a GenoBit. Cada gestión, una capa más en la memoria de la organización.',
    en: "The boards that have sustained GenoBit. Each tenure, another layer in the organization's memory.",
  },
  'archive.presidency': { es: 'Presidencia', en: 'Presidency' },
  'archive.highlights': { es: 'Logros destacados', en: 'Highlights' },
  'archive.team': { es: 'Equipo', en: 'Team' },
  'archive.alt': { es: 'Gestión', en: 'Tenure' },

  // Language toggle
  'lang.label': { es: 'Idioma', en: 'Language' },

  // Join page
  'join.header.eyebrow': { es: 'Aplica · 2025', en: 'Apply · 2025' },
  'join.header.title': { es: 'Únete a GenoBit', en: 'Join GenoBit' },
  'join.header.lead': {
    es: 'Cuéntanos quién eres y dónde quieres sumarte. Una persona del equipo te contactará después de revisar tu aplicación.',
    en: 'Tell us who you are and where you want to plug in. A team member will reach out after reviewing your application.',
  },
  'join.closed.title': {
    es: 'Aplicaciones cerradas por ahora',
    en: 'Applications closed for now',
  },
  'join.closed.body': {
    es: 'No estamos recibiendo nuevas aplicaciones en este momento. Síguenos en Instagram para la próxima convocatoria.',
    en: 'We are not accepting new applications right now. Follow us on Instagram for the next call.',
  },
  'join.closed.cta': { es: 'Instagram', en: 'Instagram' },

  'join.section.about': { es: 'Sobre ti', en: 'About you' },
  'join.section.interest': { es: 'Tu interés', en: 'Your interest' },
  'join.section.background': { es: 'Tu trayectoria', en: 'Your background' },

  'join.field.fullName': { es: 'Nombre completo', en: 'Full name' },
  'join.field.email': { es: 'Correo electrónico', en: 'Email' },
  'join.field.phone': { es: 'Teléfono', en: 'Phone' },
  'join.field.career': { es: 'Carrera', en: 'Career' },
  'join.field.careerOther': {
    es: 'Carrera (especifica)',
    en: 'Career (specify)',
  },
  'join.field.semester': { es: 'Semestre', en: 'Semester' },
  'join.field.group': { es: 'Área', en: 'Area' },
  'join.field.subArea': { es: 'Sub-área', en: 'Sub-area' },
  'join.field.motivation': {
    es: '¿Por qué quieres unirte?',
    en: 'Why do you want to join?',
  },
  'join.field.linkedinUrl': {
    es: 'LinkedIn (opcional)',
    en: 'LinkedIn (optional)',
  },
  'join.field.githubUrl': { es: 'GitHub (opcional)', en: 'GitHub (optional)' },
  'join.field.consent': {
    es: 'Acepto ser contactado por GenoBit sobre mi aplicación.',
    en: 'I agree to be contacted by GenoBit about my application.',
  },
  'join.field.privacy': {
    es: 'Al enviar aceptas nuestro',
    en: 'By submitting you accept our',
  },
  'join.field.privacy.link': {
    es: 'aviso de privacidad',
    en: 'privacy notice',
  },

  'join.placeholder.fullName': { es: 'Tu nombre', en: 'Your name' },
  'join.placeholder.email': { es: 'tu@correo.com', en: 'you@email.com' },
  'join.placeholder.phone': { es: '+52 81 0000 0000', en: '+52 81 0000 0000' },
  'join.placeholder.motivation': {
    es: 'Comparte qué te interesa de GenoBit y qué te gustaría aportar.',
    en: 'Share what interests you about GenoBit and what you would bring.',
  },

  'join.semester.graduate': { es: 'Egresado/a', en: 'Graduate' },
  'join.career.other': { es: 'Otra', en: 'Other' },

  'join.subArea.research': { es: 'Investigación', en: 'Research' },
  'join.subArea.finance': { es: 'Finanzas', en: 'Finance' },
  'join.subArea.logistics': { es: 'Logística', en: 'Logistics' },
  'join.subArea.marketing': { es: 'Marketing', en: 'Marketing' },
  'join.subArea.social-responsibility': {
    es: 'Responsabilidad Social',
    en: 'Social Responsibility',
  },
  'join.subArea.education': { es: 'Educación', en: 'Education' },
  'join.subArea.it-web': { es: 'TI / Web', en: 'IT / Web' },

  'join.submit': { es: 'Enviar aplicación', en: 'Submit application' },
  'join.submitting': { es: 'Enviando…', en: 'Submitting…' },

  'join.success.title': {
    es: 'Aplicación recibida',
    en: 'Application received',
  },
  'join.success.body': {
    es: 'Gracias por aplicar a GenoBit. Una persona del equipo te contactará al correo que registraste.',
    en: 'Thanks for applying to GenoBit. A team member will reach out at the email you provided.',
  },
  'join.success.again': {
    es: 'Enviar otra aplicación',
    en: 'Submit another application',
  },

  'join.error.duplicate': {
    es: 'Ya recibimos una aplicación desde este correo recientemente. Si necesitas actualizar tu información, escríbenos a genobit.mty@gmail.com.',
    en: 'We already received an application from this email recently. If you need to update it, email genobit.mty@gmail.com.',
  },
  'join.error.closed': {
    es: 'Las aplicaciones están cerradas en este momento.',
    en: 'Applications are closed right now.',
  },
  'join.error.subAreaRequired': {
    es: 'Selecciona una sub-área para Student Community.',
    en: 'Pick a sub-area for Student Community.',
  },
  'join.error.generic': {
    es: 'No se pudo enviar la aplicación. Intenta de nuevo.',
    en: 'Could not submit the application. Please try again.',
  },

  'join.validation.required': { es: 'Requerido', en: 'Required' },
  'join.validation.email': { es: 'Correo inválido', en: 'Invalid email' },
  'join.validation.motivationMax': {
    es: 'Máximo 500 caracteres',
    en: 'Max 500 characters',
  },

  // Privacy page
  'privacy.title': { es: 'Aviso de privacidad', en: 'Privacy notice' },
  'privacy.placeholder': {
    es: 'El aviso de privacidad completo se publicará pronto. Mientras tanto: los datos que compartas en la aplicación se usan únicamente para evaluar tu solicitud y contactarte sobre la misma. Para dudas, escríbenos a genobit.mty@gmail.com.',
    en: 'The full privacy notice will be published soon. In the meantime: the data you share in the application is used only to evaluate your request and contact you about it. For questions, email genobit.mty@gmail.com.',
  },
  'privacy.back': { es: '← Volver', en: '← Back' },

  // Home / join CTA section
  'home.join.label': { es: '— 04 / Aplica', en: '— 04 / Apply' },
  'home.join.title': { es: 'Únete', en: 'Join us' },
  'home.join.body': {
    es: 'Estudiantes de cualquier carrera, en cualquier semestre. Si te interesa la bioinformática o la genómica computacional, queremos conocerte.',
    en: 'Students from any major, any semester. If bioinformatics or computational genomics interests you, we want to meet you.',
  },
  'home.join.cta': { es: 'Aplicar ahora', en: 'Apply now' },
} as const satisfies Record<string, { es: string; en: string }>

export type StringKey = keyof typeof dict

export function translate(key: StringKey, lang: Lang): string {
  return dict[key][lang]
}
