import type { APIRoute } from "astro";
import { siteConfig } from "../config/site.config";

/**
 * La favicon è generata dal marchio, non è un file statico: così ogni
 * bottega ha la propria senza doverla disegnare. Viene creata una volta
 * durante la compilazione e servita come `/favicon.svg`.
 *
 * Per usare un'icona tua, metti `favicon.svg` in `public/` ed elimina
 * questo file.
 */

function escapeXml(testo: string): string {
  return testo
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const GET: APIRoute = () => {
  /* In 64 pixel ci stanno poche lettere: se il monogramma è già corto lo
     usiamo com'è ("HD"), altrimenti riduciamo il nome alle sue iniziali
     ("Bottega del Ponte" → "BDP"). */
  const corto = siteConfig.logo.monogramma;
  const monogramma = (
    corto.length <= 3
      ? corto
      : siteConfig.nomeAttivita
          .split(/\s+/)
          .filter(Boolean)
          .map((parola) => parola[0])
          .join("")
          .slice(0, 3)
  ).toUpperCase();

  /* Il testo deve restare dentro il quadrato anche con tre lettere */
  const corpo = { 1: 42, 2: 34, 3: 25 }[monogramma.length] ?? 25;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#fcfbf9"/>
  <text x="32" y="${32 + corpo * 0.36}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${corpo}" font-weight="500" letter-spacing="-1"
        fill="#161513">${escapeXml(monogramma)}</text>
</svg>
`;

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
};
