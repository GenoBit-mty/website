import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./admin";

const bilingualValidator = v.object({ es: v.string(), en: v.string() });

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("events").order("desc").collect();
  },
});

export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("isUpcoming"), true))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    category: v.optional(v.string()),
    title: bilingualValidator,
    description: bilingualValidator,
    date: v.string(),
    location: v.string(),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    registrationUrl: v.optional(v.string()),
    isUpcoming: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const { sessionToken, ...rest } = args;
    return await ctx.db.insert("events", rest);
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("events"),
    category: v.optional(v.string()),
    title: v.optional(bilingualValidator),
    description: v.optional(bilingualValidator),
    date: v.optional(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    registrationUrl: v.optional(v.string()),
    isUpcoming: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const { sessionToken, id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return null;
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id("events") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
    return null;
  },
});

const eventImage =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200";
const meetupImage =
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200";
const hackathonImage =
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=1200";
const lectureImage =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200";
const labSessionImage =
  "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&q=80&w=1200";
const seminarImage =
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=1200";

export const seedEvents = mutation({
  args: { sessionToken: v.string() },
  returns: v.object({ inserted: v.number(), deleted: v.number() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const existing = await ctx.db.query("events").collect();
    for (const e of existing) {
      await ctx.db.delete(e._id);
    }

    const events: Array<Parameters<typeof ctx.db.insert<"events">>[1]> = [
      {
        category: "Taller",
        title: {
          es: "Introducción a Genómica Computacional",
          en: "Introduction to Computational Genomics",
        },
        description: {
          es: [
            "Sesión práctica para analizar variantes genéticas con pipelines reproducibles desde la línea de comandos.",
            "Cubriremos alineación de lecturas, llamado de variantes y filtrado de calidad. Incluye un dataset de práctica para llevar a casa y un ambiente preconfigurado en Docker.",
            "Requisitos: laptop con Docker instalado y conocimientos básicos de terminal.",
          ].join("\n\n"),
          en: [
            "Hands-on session to analyze genetic variants with reproducible pipelines from the command line.",
            "We'll cover read alignment, variant calling, and quality filtering. Includes a take-home practice dataset and a preconfigured Docker environment.",
            "Requirements: laptop with Docker installed and basic terminal knowledge.",
          ].join("\n\n"),
        },
        date: "2026-05-12 · 18:00",
        location: "Facultad de Ciencias, Monterrey",
        imageUrl: eventImage,
        galleryImageUrls: [eventImage, lectureImage],
        isUpcoming: true,
        registrationUrl: "https://genobit.mx/events/genomica-computacional",
      },
      {
        category: "Meetup",
        title: {
          es: "Bioinfo Night: Visualización de datos ómicos",
          en: "Bioinfo Night: Omics Data Visualization",
        },
        description: {
          es: "Networking y demos rápidas de herramientas de visualización para transcriptómica. Espacio abierto para compartir proyectos en curso y resolver dudas técnicas en comunidad.",
          en: "Networking and lightning demos of visualization tools for transcriptomics. Open space to share ongoing projects and tackle technical questions as a community.",
        },
        date: "2026-06-03 · 19:30",
        location: "Hub de Innovación GenoBit",
        imageUrl: meetupImage,
        galleryImageUrls: [meetupImage],
        isUpcoming: true,
      },
      {
        category: "Hackathon",
        title: {
          es: "AlphaFold Hack Weekend",
          en: "AlphaFold Hack Weekend",
        },
        description: {
          es: [
            "Fin de semana de hackathon enfocado en herramientas de predicción de estructura proteica con AlphaFold.",
            "Trabajaremos en equipos interdisciplinarios para construir prototipos funcionales en 48 horas. Habrá mentoría de investigadores y premios para los mejores proyectos.",
          ].join("\n\n"),
          en: [
            "Weekend hackathon focused on protein structure prediction tools with AlphaFold.",
            "We'll work in interdisciplinary teams to build functional prototypes in 48 hours. Mentorship from researchers and prizes for the best projects.",
          ].join("\n\n"),
        },
        date: "2026-07-18 · 09:00",
        location: "Tec de Monterrey, Campus Monterrey",
        imageUrl: hackathonImage,
        galleryImageUrls: [hackathonImage],
        isUpcoming: true,
        registrationUrl: "https://genobit.mx/events/alphafold-hack",
      },
      {
        category: "Conferencia",
        title: {
          es: "Charla: Aprendizaje profundo en neuroimagen",
          en: "Talk: Deep Learning in Neuroimaging",
        },
        description: {
          es: "Charla magistral sobre el uso de redes neuronales convolucionales en MRI volumétrico para detección temprana de Alzheimer. Sesión abierta a toda la comunidad universitaria.",
          en: "Keynote on convolutional neural networks for volumetric MRI in early Alzheimer's detection. Open to the entire university community.",
        },
        date: "2026-03-22 · 17:00",
        location: "Auditorio Carlos Prieto, Tec de Monterrey",
        imageUrl: lectureImage,
        galleryImageUrls: [lectureImage],
        isUpcoming: false,
      },
      {
        category: "Taller",
        title: {
          es: "Workshop: Python para biología",
          en: "Workshop: Python for Biology",
        },
        description: {
          es: "Introducción práctica a Python aplicado al análisis de secuencias biológicas, manipulación de datos tabulares con pandas y visualización con matplotlib.",
          en: "Hands-on intro to Python applied to biological sequence analysis, tabular data wrangling with pandas, and matplotlib visualization.",
        },
        date: "2026-02-14 · 10:00",
        location: "Aula Digital B-3, Tec de Monterrey",
        imageUrl: labSessionImage,
        galleryImageUrls: [labSessionImage],
        isUpcoming: false,
      },
      {
        category: "Seminario",
        title: {
          es: "Lanzamiento del repositorio comunitario GenoBit",
          en: "GenoBit Community Repository Launch",
        },
        description: {
          es: [
            "Lanzamiento oficial del repositorio comunitario de GenoBit con notebooks, datasets y herramientas de bioinformática listas para usarse.",
            "Sesión informativa con demo en vivo y guía para contribuir.",
          ].join("\n\n"),
          en: [
            "Official launch of the GenoBit community repository with ready-to-use bioinformatics notebooks, datasets, and tools.",
            "Info session with a live demo and a contributing guide.",
          ].join("\n\n"),
        },
        date: "2025-11-08 · 16:00",
        location: "Online · Zoom",
        imageUrl: seminarImage,
        galleryImageUrls: [seminarImage],
        isUpcoming: false,
      },
    ];

    for (const ev of events) {
      await ctx.db.insert("events", ev);
    }

    return { inserted: events.length, deleted: existing.length };
  },
});
