import { defineApp } from "convex/server";
import content from "./components/content/convex.config";

const app = defineApp();
app.use(content);

export default app;