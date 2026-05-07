import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

const TENURE = "2025-2026";

const directives = [
  { name: "Angel Orlando Anguiano Peña", role: "President", career: "ITC" },
  { name: "Estefanía Sauceda Camacho", role: "Vicepresident", career: "IBT" },
  { name: "Eduardo Cepeda Torres", role: "TI Director", career: "ITC" },
  { name: "José Luis Arias López", role: "Research General Director", career: "MSc BI" },
  { name: "Alberto Palomino", role: "Finance Director", career: "IDM" },
  { name: "Marcelo Treviño Velazquez", role: "Logistics Director", career: "ITC" },
  { name: "Vanessa Gonzalez Garza", role: "Social Responsibility Director", career: "IBT" },
  { name: "Silvanna Farias", role: "Marketing Director", career: "ITC" },
  { name: "Sofia Acuña Luévano", role: "Education Director", career: "IBT" },
];

const ndrg = [
  { name: "Fedra Fernanda Mandujano Lopez", role: "Principal Investigator: Neuroimaging Division", career: "IDM" },
  { name: "Rogelio Emiliano Lara de Luna", role: "Principal Investigator: Biomarkers Division", career: "IBT" },
  { name: "Josué Uziel", role: "Developer and Researcher", career: "IDM" },
  { name: "Daniela Herrera García", role: "Developer and Researcher", career: "ITC" },
  { name: "Angel Orlando Anguiano Peña", role: "Developer and Researcher", career: "ITC" },
  { name: "Andrea de Jesús Olivares Segura", role: "Researcher", career: "MC" },
  { name: "Luis Michel Zamora", role: "Researcher", career: "IBT" },
  { name: "Diego Ynurreta", role: "Developer and Researcher", career: "IBT" },
  { name: "Sebastián Rosas", role: "Researcher", career: "IBT" },
  { name: "Emiliano Hervert de la Cruz", role: "Developer", career: "IDM" },
  { name: "Sofia Moreno Lopez", role: "Developer", career: "ITC" },
  { name: "Gilberto Angel Camacho", role: "Developer", career: "ITC" },
  { name: "Sebastián Peñafiel", role: "Developer", career: "ITC" },
];

const proteomics = [
  { name: "Angel Orlando Anguiano Peña", role: "Principal Investigator: Proteomics within AlphaFold", career: "ITC" },
  { name: "Zyanya Zapata Lozano", role: "Principal Investigator: Molecular Biology", career: "IBT" },
  { name: "Daniel Corral", role: "Developer and Researcher", career: "IBT" },
  { name: "Daniela Garcia Garza", role: "Researcher", career: "IBT" },
  { name: "Fátima Castillo Aguirre", role: "Developer", career: "IBT" },
  { name: "Juana Isabel Cruz Arango", role: "Researcher", career: "IBT" },
];

const studentCommunity = [
  { name: "Luis Antonio Bolaina Dominguez", role: "Web Developer", career: "ITC" },
  { name: "Lucero Diaz", role: "Web Developer", career: "IDM" },
  { name: "Isaac Diaz", role: "Finance Coordinator", career: "IBT" },
  { name: "Magda Gianina Colunga Minutti", role: "Finance and Logistics Coordinator", career: "ITC" },
  { name: "Alejandro Longoria Lozano", role: "Logistics Coordinator", career: "IBT" },
  { name: "Emilio Barragán Godoy", role: "Logistics Coordinator", career: "ITC" },
  { name: "Ángeles Escareño Garay", role: "Social Responsibility Coordinator", career: "IBT" },
  { name: "Ivanna Janis Galvez Lara", role: "Marketing subdirector", career: "IBT" },
  { name: "Marisol Guedea", role: "Marketing coordinator", career: "IBT" },
];

export const seedGenobitTeam = mutation({
  args: {},
  returns: v.object({
    inserted: v.number(),
    deleted: v.number(),
  }),
  handler: async (ctx) => {
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
      await ctx.db.insert("teamMembers", {
        ...m,
        group: "ndrg",
        order: order++,
      });
      inserted++;
    }

    for (const m of proteomics) {
      await ctx.db.insert("teamMembers", {
        ...m,
        group: "proteomics",
        order: order++,
      });
      inserted++;
    }

    for (const m of studentCommunity) {
      await ctx.db.insert("teamMembers", {
        ...m,
        group: "student-community",
        order: order++,
      });
      inserted++;
    }

    return { inserted, deleted: existing.length };
  },
});
