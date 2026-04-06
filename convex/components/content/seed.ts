import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

export const seedDemoData = mutation({
  args: {},
  returns: v.object({
    events: v.number(),
    teamMembers: v.number(),
    research: v.number(),
    pastAdministrations: v.number(),
    labs: v.number(),
  }),
  handler: async (ctx) => {
    const existingEvents = await ctx.db.query("events").take(1);
    if (existingEvents.length > 0) {
      return {
        events: 0,
        teamMembers: 0,
        research: 0,
        pastAdministrations: 0,
        labs: 0,
      };
    }

    const eventImage = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200";
    const teamImage = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200";
    const researchImage = "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1200";
    const labImage = "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1200";

    await ctx.db.insert("events", {
      category: "Taller",
      title: "Introduccion a Genomica Computacional",
      description: "Sesion practica para analizar variantes geneticas con pipelines reproducibles.",
      date: "2026-05-12",
      location: "Facultad de Ciencias, Monterrey",
      imageUrl: eventImage,
      galleryImageUrls: [eventImage],
      isUpcoming: true,
      registrationUrl: "https://genobit.mx/events/genomica-computacional",
    });

    await ctx.db.insert("events", {
      category: "Meetup",
      title: "Bioinfo Night: Visualizacion de datos omicos",
      description: "Networking y demos rapidas de herramientas de visualizacion para transcriptomica.",
      date: "2026-06-03",
      location: "Hub de Innovacion GenoBit",
      imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200",
      galleryImageUrls: [eventImage],
      isUpcoming: true,
    });

    await ctx.db.insert("teamMembers", {
      name: "Andrea Ruiz",
      role: "Presidenta",
      bio: "Coordina proyectos de bioinformatica aplicada y colaboraciones interuniversitarias.",
      imageUrl: teamImage,
      galleryImageUrls: [teamImage],
      linkedinUrl: "https://linkedin.com",
      githubUrl: "https://github.com",
      order: 1,
    });

    await ctx.db.insert("teamMembers", {
      name: "Jorge Salinas",
      role: "Lead de Labs",
      bio: "Disena experiencias practicas para acercar la computacion al laboratorio.",
      imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200",
      galleryImageUrls: [teamImage],
      order: 2,
    });

    await ctx.db.insert("research", {
      title: "Pipeline para deteccion de variantes somaticas en cohortes pequenas",
      description: "Framework reproducible para identificar variantes de alto impacto con control de calidad automatizado.",
      authors: ["A. Ruiz", "J. Salinas", "L. Mendez"],
      publicationDate: "2026-02-20",
      url: "https://doi.org/10.0000/genobit.2026.001",
      imageUrl: researchImage,
      galleryImageUrls: [researchImage],
      tags: ["Genomica", "Pipelines", "NGS"],
    });

    await ctx.db.insert("pastAdministrations", {
      period: "2024-2025",
      presidentName: "Valeria Campos",
      description: "Se consolidaron talleres semanales y se lanzo el primer repositorio comunitario de GenoBit.",
      imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1200",
      galleryImageUrls: [teamImage],
      members: [
        { name: "Valeria Campos", role: "Presidenta", imageUrl: teamImage },
        { name: "Mario Diaz", role: "Vicepresidente", imageUrl: teamImage },
      ],
    });

    await ctx.db.insert("labs", {
      title: "Lab de Transcriptomica",
      summary: "Analisis end-to-end de RNA-seq con notebook reproducible.",
      description: "El laboratorio incluye limpieza de lecturas, cuantificacion y analisis de expresion diferencial.",
      focusAreas: ["RNA-seq", "Python", "Visualizacion"],
      lead: "Jorge Salinas",
      location: "Aula de Computo B-201",
      imageUrl: labImage,
      galleryImageUrls: [labImage],
    });

    return {
      events: 2,
      teamMembers: 2,
      research: 1,
      pastAdministrations: 1,
      labs: 1,
    };
  },
});
