import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./admin";

const bilingualValidator = v.object({ es: v.string(), en: v.string() });

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("labs").collect();
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: bilingualValidator,
    summary: bilingualValidator,
    description: v.optional(bilingualValidator),
    focusAreas: v.optional(v.array(v.string())),
    lead: v.optional(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const { sessionToken, ...rest } = args;
    return await ctx.db.insert("labs", rest);
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("labs"),
    title: v.optional(bilingualValidator),
    summary: v.optional(bilingualValidator),
    description: v.optional(bilingualValidator),
    focusAreas: v.optional(v.array(v.string())),
    lead: v.optional(v.string()),
    location: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const { sessionToken, id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return null;
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id("labs") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
    return null;
  },
});

const ndrgDescription = {
  es: [
    "El Neurodegenerative Diseases Research Group dentro de GenoBit se enfoca en la aplicación de métodos computacionales para entender, detectar y analizar mejor los trastornos neurológicos, con énfasis particular en la enfermedad de Alzheimer.",
    "Nuestro trabajo integra fuentes de datos multimodales, incluyendo neuroimagen 3D por MRI y biomarcadores derivados de sangre y líquido cefalorraquídeo (LCR). A través de estos datasets, buscamos capturar tanto los cambios estructurales en el cerebro como las señales biológicas subyacentes asociadas a la progresión de la enfermedad.",
    "Actualmente desarrollamos y exploramos técnicas modernas de aprendizaje automático y aprendizaje profundo para mejorar el diagnóstico temprano y la clasificación del Alzheimer. Esto incluye trabajar con datos volumétricos de imagen cerebral para identificar patrones de neurodegeneración, así como aprovechar marcadores bioquímicos para mejorar la precisión predictiva.",
    "Al combinar estos enfoques, nuestro objetivo es contribuir con herramientas diagnósticas más robustas y data-driven que apoyen la detección temprana y avancen la investigación en enfermedades neurodegenerativas.",
  ].join("\n\n"),
  en: [
    "The Neurodegenerative Diseases Research Group within GenoBit focuses on the application of computational methods to better understand, detect, and analyze neurological disorders, with a particular emphasis on Alzheimer's disease.",
    "Our work integrates multimodal data sources, including 3D MRI neuroimaging and biomarkers derived from blood and cerebrospinal fluid (CSF). Through these datasets, we aim to capture both structural changes in the brain and underlying biological signals associated with disease progression.",
    "Currently, we are developing and exploring modern techniques based on machine learning and deep learning to improve early diagnosis and classification of Alzheimer's. This includes working with volumetric brain imaging data to identify patterns of neurodegeneration, as well as leveraging biochemical markers to enhance predictive accuracy.",
    "By combining these approaches, our goal is to contribute to more robust, data-driven diagnostic tools that can support early detection and advance research in neurodegenerative diseases.",
  ].join("\n\n"),
};

const proteomicsDescription = {
  es: [
    "El Proteomics and Molecular Biology Group dentro de GenoBit se enfoca en tender puentes entre la biología molecular y las herramientas computacionales a través de experiencias de aprendizaje innovadoras y accesibles.",
    "Nuestro trabajo se centra en el desarrollo de tecnologías educativas que introducen conceptos clave en la estructura y función de las proteínas, con un énfasis particular en el problema del plegamiento de proteínas. Para lograrlo, aprovechamos herramientas avanzadas como AlphaFold para explorar cómo las estructuras proteicas pueden predecirse y comprenderse mediante métodos computacionales.",
    "Actualmente diseñamos una aplicación móvil construida en Swift, dirigida a estudiantes más jóvenes y aprendices en etapa temprana interesados en la bioingeniería y campos relacionados. Esta plataforma integra visualizaciones interactivas de estructuras proteicas con lecciones guiadas en biología molecular y bioinformática, permitiendo a los usuarios explorar conceptos complejos de manera intuitiva mediante un enfoque práctico.",
    "Al combinar educación, visualización y herramientas computacionales de vanguardia, nuestro objetivo es hacer que la proteómica y la bioinformática sean más accesibles, atractivas e inspiradoras para la próxima generación de ingenieros y científicos.",
  ].join("\n\n"),
  en: [
    "The Proteomics and Molecular Biology Group within GenoBit focuses on bridging molecular biology and computational tools through innovative, accessible learning experiences.",
    "Our work centers on the development of educational technologies that introduce key concepts in protein structure and function, with a particular emphasis on the protein folding problem. To achieve this, we leverage advanced tools such as AlphaFold to explore how protein structures can be predicted and understood through computational methods.",
    "We are currently designing a mobile application built in Swift, aimed at younger students and early-stage learners interested in bioengineering and related fields. This platform integrates interactive visualizations of protein structures with guided lessons in molecular biology and bioinformatics, allowing users to intuitively explore complex concepts through a hands-on approach.",
    "By combining education, visualization, and cutting-edge computational tools, our goal is to make proteomics and bioinformatics more approachable, engaging, and inspiring for the next generation of engineers and scientists.",
  ].join("\n\n"),
};

export const seedLabs = mutation({
  args: { sessionToken: v.string() },
  returns: v.object({ inserted: v.number(), deleted: v.number() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const existing = await ctx.db.query("labs").collect();
    for (const l of existing) {
      await ctx.db.delete(l._id);
    }

    await ctx.db.insert("labs", {
      title: {
        es: "Neurodegenerative Diseases Research Group",
        en: "Neurodegenerative Diseases Research Group",
      },
      summary: {
        es: "Métodos computacionales aplicados al estudio de enfermedades neurológicas, con énfasis en Alzheimer.",
        en: "Computational methods applied to neurological diseases, with a focus on Alzheimer's.",
      },
      description: ndrgDescription,
      focusAreas: ["Neuroimaging", "Biomarkers", "Deep Learning", "MRI"],
      lead: "Fedra Fernanda Mandujano Lopez · Rogelio Emiliano Lara de Luna",
    });

    await ctx.db.insert("labs", {
      title: {
        es: "Proteomics and Molecular Biology Group",
        en: "Proteomics and Molecular Biology Group",
      },
      summary: {
        es: "Puentes entre biología molecular y computación a través de experiencias de aprendizaje accesibles.",
        en: "Bridging molecular biology and computing through accessible learning experiences.",
      },
      description: proteomicsDescription,
      focusAreas: ["AlphaFold", "Protein Folding", "Education", "Swift"],
      lead: "Angel Orlando Anguiano Peña · Zyanya Zapata Lozano",
    });

    return { inserted: 2, deleted: existing.length };
  },
});
