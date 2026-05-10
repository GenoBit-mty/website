import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./admin";

const TENURE = "2025-2026";

const bilingualValidator = v.object({ es: v.string(), en: v.string() });

const directives = [
  { name: "Angel Orlando Anguiano Peña", role: { es: "Presidente", en: "President" }, career: "ITC" },
  { name: "Estefanía Sauceda Camacho", role: { es: "Vicepresidenta", en: "Vicepresident" }, career: "IBT" },
  { name: "Eduardo Cepeda Torres", role: { es: "Director de TI", en: "TI Director" }, career: "ITC" },
  { name: "José Luis Arias López", role: { es: "Director General de Investigación", en: "Research General Director" }, career: "MSc BI" },
  { name: "Alberto Palomino", role: { es: "Director de Finanzas", en: "Finance Director" }, career: "IDM" },
  { name: "Marcelo Treviño Velazquez", role: { es: "Director de Logística", en: "Logistics Director" }, career: "ITC" },
  { name: "Vanessa Gonzalez Garza", role: { es: "Directora de Responsabilidad Social", en: "Social Responsibility Director" }, career: "IBT" },
  { name: "Silvanna Farias", role: { es: "Directora de Marketing", en: "Marketing Director" }, career: "ITC" },
  { name: "Sofia Acuña Luévano", role: { es: "Directora de Educación", en: "Education Director" }, career: "IBT" },
];

const ndrg = [
  { name: "Fedra Fernanda Mandujano Lopez", role: { es: "Investigadora Principal: División de Neuroimagen", en: "Principal Investigator: Neuroimaging Division" }, career: "IDM" },
  { name: "Rogelio Emiliano Lara de Luna", role: { es: "Investigador Principal: División de Biomarcadores", en: "Principal Investigator: Biomarkers Division" }, career: "IBT" },
  { name: "Josué Uziel", role: { es: "Desarrollador e Investigador", en: "Developer and Researcher" }, career: "IDM" },
  { name: "Daniela Herrera García", role: { es: "Desarrolladora e Investigadora", en: "Developer and Researcher" }, career: "ITC" },
  { name: "Angel Orlando Anguiano Peña", role: { es: "Desarrollador e Investigador", en: "Developer and Researcher" }, career: "ITC" },
  { name: "Andrea de Jesús Olivares Segura", role: { es: "Investigadora", en: "Researcher" }, career: "MC" },
  { name: "Luis Michel Zamora", role: { es: "Investigador", en: "Researcher" }, career: "IBT" },
  { name: "Diego Ynurreta", role: { es: "Desarrollador e Investigador", en: "Developer and Researcher" }, career: "IBT" },
  { name: "Sebastián Rosas", role: { es: "Investigador", en: "Researcher" }, career: "IBT" },
  { name: "Emiliano Hervert de la Cruz", role: { es: "Desarrollador", en: "Developer" }, career: "IDM" },
  { name: "Sofia Moreno Lopez", role: { es: "Desarrolladora", en: "Developer" }, career: "ITC" },
  { name: "Gilberto Angel Camacho", role: { es: "Desarrollador", en: "Developer" }, career: "ITC" },
  { name: "Sebastián Peñafiel", role: { es: "Desarrollador", en: "Developer" }, career: "ITC" },
];

const proteomics = [
  { name: "Angel Orlando Anguiano Peña", role: { es: "Investigador Principal: Proteómica dentro de AlphaFold", en: "Principal Investigator: Proteomics within AlphaFold" }, career: "ITC" },
  { name: "Zyanya Zapata Lozano", role: { es: "Investigadora Principal: Biología Molecular", en: "Principal Investigator: Molecular Biology" }, career: "IBT" },
  { name: "Daniel Corral", role: { es: "Desarrollador e Investigador", en: "Developer and Researcher" }, career: "IBT" },
  { name: "Daniela Garcia Garza", role: { es: "Investigadora", en: "Researcher" }, career: "IBT" },
  { name: "Fátima Castillo Aguirre", role: { es: "Desarrolladora", en: "Developer" }, career: "IBT" },
  { name: "Juana Isabel Cruz Arango", role: { es: "Investigadora", en: "Researcher" }, career: "IBT" },
];

const studentCommunity = [
  { name: "Luis Antonio Bolaina Dominguez", role: { es: "Desarrollador Web", en: "Web Developer" }, career: "ITC" },
  { name: "Lucero Diaz", role: { es: "Desarrolladora Web", en: "Web Developer" }, career: "IDM" },
  { name: "Isaac Diaz", role: { es: "Coordinador de Finanzas", en: "Finance Coordinator" }, career: "IBT" },
  { name: "Magda Gianina Colunga Minutti", role: { es: "Coordinadora de Finanzas y Logística", en: "Finance and Logistics Coordinator" }, career: "ITC" },
  { name: "Alejandro Longoria Lozano", role: { es: "Coordinador de Logística", en: "Logistics Coordinator" }, career: "IBT" },
  { name: "Emilio Barragán Godoy", role: { es: "Coordinador de Logística", en: "Logistics Coordinator" }, career: "ITC" },
  { name: "Ángeles Escareño Garay", role: { es: "Coordinadora de Responsabilidad Social", en: "Social Responsibility Coordinator" }, career: "IBT" },
  { name: "Ivanna Janis Galvez Lara", role: { es: "Subdirectora de Marketing", en: "Marketing subdirector" }, career: "IBT" },
  { name: "Marisol Guedea", role: { es: "Coordinadora de Marketing", en: "Marketing coordinator" }, career: "IBT" },
];

export const get = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("teamMembers").collect();
    return members.sort(
      (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER),
    );
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    role: bilingualValidator,
    career: v.optional(v.string()),
    group: v.optional(v.string()),
    tenure: v.optional(v.string()),
    isFirstBoard: v.optional(v.boolean()),
    bio: v.optional(bilingualValidator),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const { sessionToken, ...rest } = args;
    return await ctx.db.insert("teamMembers", rest);
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("teamMembers"),
    name: v.optional(v.string()),
    role: v.optional(bilingualValidator),
    career: v.optional(v.string()),
    group: v.optional(v.string()),
    tenure: v.optional(v.string()),
    isFirstBoard: v.optional(v.boolean()),
    bio: v.optional(bilingualValidator),
    imageUrl: v.optional(v.string()),
    galleryImageUrls: v.optional(v.array(v.string())),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    const { sessionToken, id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return null;
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id("teamMembers") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);
    await ctx.db.delete(args.id);
    return null;
  },
});

export const setOrder = mutation({
  args: {
    sessionToken: v.string(),
    group: v.string(),
    orderedIds: v.array(v.id("teamMembers")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const all = await ctx.db.query("teamMembers").collect();
    const groupMembers = all.filter((m) => m.group === args.group);
    const groupIds = new Set(groupMembers.map((m) => m._id));

    for (const id of args.orderedIds) {
      if (!groupIds.has(id)) {
        throw new Error(`Member ${id} is not in group ${args.group}`);
      }
    }
    if (args.orderedIds.length !== groupMembers.length) {
      throw new Error(
        `Expected ${groupMembers.length} ids for group ${args.group}, got ${args.orderedIds.length}`,
      );
    }

    const otherMaxOrder = all
      .filter((m) => m.group !== args.group)
      .reduce((max, m) => Math.max(max, m.order ?? -1), -1);

    let nextOrder = otherMaxOrder + 1;
    for (const id of args.orderedIds) {
      await ctx.db.patch(id, { order: nextOrder++ });
    }
    return null;
  },
});

export const seedGenobitTeam = mutation({
  args: { sessionToken: v.string() },
  returns: v.object({ inserted: v.number(), deleted: v.number() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const existing = await ctx.db.query("teamMembers").collect();
    for (const m of existing) {
      await ctx.db.delete(m._id);
    }

    let order = 0;
    let inserted = 0;

    for (const m of directives) {
      await ctx.db.insert("teamMembers", {
        ...m,
        group: "directives",
        tenure: TENURE,
        isFirstBoard: true,
        order: order++,
      });
      inserted++;
    }
    for (const m of ndrg) {
      await ctx.db.insert("teamMembers", { ...m, group: "ndrg", order: order++ });
      inserted++;
    }
    for (const m of proteomics) {
      await ctx.db.insert("teamMembers", { ...m, group: "proteomics", order: order++ });
      inserted++;
    }
    for (const m of studentCommunity) {
      await ctx.db.insert("teamMembers", { ...m, group: "student-community", order: order++ });
      inserted++;
    }

    return { inserted, deleted: existing.length };
  },
});

export const bulkCreate = mutation({
  args: {
    sessionToken: v.string(),
    group: v.string(),
    rows: v.array(
      v.object({
        name: v.string(),
        roleEs: v.string(),
        roleEn: v.string(),
        career: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({ inserted: v.number() }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const existing = await ctx.db.query("teamMembers").collect();
    let nextOrder =
      existing.reduce(
        (max, m) => Math.max(max, m.order ?? -1),
        -1,
      ) + 1;

    let inserted = 0;
    for (const row of args.rows) {
      await ctx.db.insert("teamMembers", {
        name: row.name,
        role: { es: row.roleEs, en: row.roleEn },
        career: row.career,
        group: args.group,
        order: nextOrder++,
      });
      inserted++;
    }
    return { inserted };
  },
});

export const transitionBoard = mutation({
  args: {
    sessionToken: v.string(),
    outgoingPeriod: v.string(),
    incomingPeriod: v.string(),
    pastAdmin: v.object({
      presidentName: v.string(),
      description: v.optional(bilingualValidator),
      imageUrl: v.optional(v.string()),
      galleryImageUrls: v.optional(v.array(v.string())),
    }),
    incomingMembers: v.array(
      v.object({
        name: v.string(),
        role: bilingualValidator,
        career: v.optional(v.string()),
        email: v.optional(v.string()),
        linkedinUrl: v.optional(v.string()),
        githubUrl: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({ pastAdminId: v.id("pastAdministrations") }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    const all = await ctx.db.query("teamMembers").collect();
    const outgoing = all.filter((m) => m.group === "directives");

    const archivedMembers = outgoing.map((m) => ({
      name: m.name,
      role: m.role,
      career: m.career,
      tenure: m.tenure,
      bio: m.bio,
      imageUrl: m.imageUrl,
      galleryImageUrls: m.galleryImageUrls,
      email: m.email,
      linkedinUrl: m.linkedinUrl,
      githubUrl: m.githubUrl,
    }));

    const pastAdminId = await ctx.db.insert("pastAdministrations", {
      period: args.outgoingPeriod,
      presidentName: args.pastAdmin.presidentName,
      description: args.pastAdmin.description,
      imageUrl: args.pastAdmin.imageUrl,
      galleryImageUrls: args.pastAdmin.galleryImageUrls,
      members: archivedMembers,
    });

    for (const m of outgoing) {
      await ctx.db.delete(m._id);
    }

    const otherMaxOrder = all
      .filter((m) => m.group !== "directives")
      .reduce((max, m) => Math.max(max, m.order ?? -1), -1);

    let nextOrder = otherMaxOrder + 1;
    for (const incoming of args.incomingMembers) {
      await ctx.db.insert("teamMembers", {
        name: incoming.name,
        role: incoming.role,
        career: incoming.career,
        group: "directives",
        tenure: args.incomingPeriod,
        isFirstBoard: false,
        email: incoming.email,
        linkedinUrl: incoming.linkedinUrl,
        githubUrl: incoming.githubUrl,
        imageUrl: incoming.imageUrl,
        order: nextOrder++,
      });
    }

    return { pastAdminId };
  },
});
