// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

/**
 * L'indirizzo pubblico del sito serve per la sitemap, i link canonici e i
 * meta tag di condivisione. Impostalo con la variabile SITE_URL; il valore
 * di ripiego va bene solo per lo sviluppo in locale.
 */
const site = process.env.SITE_URL ?? "http://localhost:4321";

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [sitemap()],
});
