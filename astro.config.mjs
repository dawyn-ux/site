// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// URL publique du site (utilisée pour les balises canonical, le sitemap et Open Graph).
// À définir dans Vercel : Settings → Environment Variables → SITE_URL
const SITE_URL = process.env.SITE_URL || 'https://www.connect-systemes.fr';

// Anciennes adresses du site connect-systemes.fr (HTTP) redirigées en 301
// vers les nouvelles pages pour conserver le référencement acquis.
const legacyRedirects = {
  '/index.htm': '/',
  '/index.html': '/',
  '/connectpage1.htm': '/',
  '/pageproduits.htm': '/gammes/',
  '/pageproduitsconnectiques.htm': '/gammes/connectique/',
  '/pagecontacts.htm': '/contact/',
  '/Images/RAYCHEM/Fiches Techniques/VERSAFIT.pdf': '/documentation/',
  '/Images/RAYCHEM/Fiches%20Techniques/VERSAFIT.pdf': '/documentation/',
  '/Images/STOCKO/catalogues/cossesvrac.pdf': '/documentation/',
  '/Images/STOCKO/catalogues/sto-fit.pdf': '/documentation/',
};

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  adapter: vercel({
    // Les pages sont statiques ; seules /api/* (connexion CMS, formulaire) sont des fonctions.
    maxDuration: 10,
  }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/api/'),
      changefreq: 'monthly',
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr-FR' } },
    }),
  ],
  redirects: Object.fromEntries(
    Object.entries(legacyRedirects).map(([from, to]) => [from, { status: 301, destination: to }]),
  ),
  env: {
    schema: {
      OAUTH_GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      OAUTH_GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  image: {
    responsiveStyles: true,
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    // Pré-optimise Three.js en développement (chargé dynamiquement par la scène 3D)
    optimizeDeps: {
      include: ['three', 'three/addons/environments/RoomEnvironment.js', 'three/addons/geometries/RoundedBoxGeometry.js'],
    },
    build: {
      // three.js (~150 Ko gzip) est isolé dans un fichier chargé à la demande sur l'accueil
      chunkSizeWarningLimit: 700,
    },
  },
});
