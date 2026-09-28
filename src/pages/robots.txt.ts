import type { APIRoute } from 'astro';
import { DEMO_MODE } from 'astro:env/client';

export const GET: APIRoute = ({ site }) => {
  if (DEMO_MODE) {
    return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const sitemap = new URL('/sitemap-index.xml', site ?? 'https://www.connect-systemes.fr').href;
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
