// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // TODO: sostituire con il dominio reale quando disponibile
  site: "https://hd-design.example.com",
  integrations: [sitemap()],
});
